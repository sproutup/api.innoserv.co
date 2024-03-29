'use strict';

/**
 * Module dependencies.
 */

/* global -Promise */
var Promise = require('bluebird');
var _ = require('lodash');
var dynamoose = require('dynamoose');
var moment = require('moment');
var Schema = dynamoose.Schema;
var redis = require('config/lib/redis');
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var cache = require('config/lib/cache');
var debug = require('debug')('up:debug:channel:model');

/**
 * Schema
 */
var ChannelSchema = new Schema({
  // id can be a composite key like 'campaignId:userId'
  id: {
    type: String,
    default: function(){ return intformat(flakeIdGen.next(), 'dec'); },
    hashKey: true
  },
  // type describes what is in the composite id
  type: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  title: {
    type: String,
    default: '',
    trim: true
  }
});

/**
 * Populate method
 */
ChannelSchema.method('populate', function (_schema) {
  var _this = this;
  var _attribute = _schema.toLowerCase() + 'Id';
  debug('populate: ', _schema);
  var model = dynamoose.model(_schema);
  return model.get(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

ChannelSchema.statics.populateLatestMessage = Promise.method(function(channel){
  var key = 'channel:' + channel.id + ':messages';
  var Message = dynamoose.model('Message');

  debug('populating latest message');
  if (!channel || !channel.id) {
    return null;
  }

  return redis.exists(key).then(function(val) {
    if (val) return val;

    debug('cache miss');
    return Message.refreshChannelCache(channel.id);
  }).then(function(val){
    return redis.zrevrange(key, 0, 0).then(function(val){
      if(val[0]){
        channel.last = JSON.parse(val[0]);
      } else {
        console.log('channel not found');
      }

      return channel;
    });
  });
});

ChannelSchema.statics.queryByUser = Promise.method(function(userId){
  var key = 'user:' + userId + ':channel:feed';
  var promises = [];
  var Member = dynamoose.model('Member');
  debug('query by user');

  return redis.exists(key).then(function(val) {
    debug('redis exists val: ', val);
    if (val) return;

    return Member.query('userId').eq(userId).exec().then(function(items){
      debug('member of ', items.length);
      return Promise.map(items, function(val){
        return redis.zadd(key, moment(val.created).utc().unix(), val.channelId);
      });
    });
  }).then(function(){
    return redis.zrevrange(key, 0, -1);
  }).then(function(channels){
    return Promise.map(channels, function(channelId) {
      return Channel.getCached(channelId);
    });
  });
});

ChannelSchema.statics.getCached = Promise.method(function(id){
  var Channel = dynamoose.model('Channel');
  var Member = dynamoose.model('Member');
  var key = 'channel:' + id;

  debug('get cached', key);
  return cache.wrap(key, function() {
    debug('cache miss: ', key);
    return Channel.get(id).then(function(item){
      debug('got channel: ', item.id);
      if(_.isUndefined(item)) return item;
      return Member.queryByChannel(id).then(function(members){
        item.members = _.keyBy(members, 'userId');
        return item;
      }).then(function(item){
        // debug('after queryByChannel', item.id);
        if(!item.refType) return item;
        var model = dynamoose.model(item.refType);
        return model.getCached(item.refId).then(function(model){
          debug('cached item: ', model.id);
          item.ref = model;
          return item;
        });
      });
    }).catch(function(err) {
      console.log('error in get cached channel', err);
    });
  });
});

ChannelSchema.statics.createNewChannel = Promise.method(function(userId, id, type, companyId){
  if (!userId) {
    throw 'A user is required to start a channel.';
  }

  var _this = this;
  var Channel = dynamoose.model('Channel');
  var Member = dynamoose.model('Member');
  var channel = new Channel({
    id: id,
    type: type
  });

  return channel.save().then(function(val){
    return channel.addMember(userId, companyId);
  }).then(function(member){
    channel.members = [member];
    return channel;
  });
});

ChannelSchema.statics.createCampaignChannel = Promise.method(function(userId, campaignId){
  var _userId;
  var _channel;
  var Campaign = dynamoose.model('Campaign');
  var campaign;

  var channelKey = campaignId + ':' + userId;
  return Campaign.get(campaignId).then(function(_campaign){
    campaign = _campaign;
    return Channel.createNewChannel(userId, channelKey, 'Campaign:User', _campaign.companyId);
  }).then(function(ch){
    // Get company ID so we can call addCompanyUsers
    debug('created channel: ', ch);
    _channel = ch;
  }).then(function() {
    // Add company members to the message channel
    debug('going to add members from company ', campaign.companyId);
    return Channel.addCompanyMembers(campaign.companyId, _channel.id);
  }).then(function() {
    // Returning getCached so we get all the members back
    return Channel.getCached(channelKey).then(function(result) {
      return result;
    });
  });
});

ChannelSchema.methods.addMember = Promise.method(function(userId, companyId){
  return dynamoose.model('Channel').addMember(userId, this.id, companyId);
});

ChannelSchema.statics.addMember = Promise.method(function(userId, channelId, companyId){
  if (!userId) {
    throw new TypeError('A userId is required to start a channel.');
  } else if (!channelId) {
    throw new TypeError('A channelId is required to start a channel.');
  }
  debug('adding ', userId, 'to channel ', channelId);

  var Channel = dynamoose.model('Channel');
  var Member = dynamoose.model('Member');
  var User = dynamoose.model('User');
  var newItem;

  // Make sure the channel exists
  // Make sure the user exists
  // Then make sure this user isn't already added to the channel
  // If we're good, save the member
  // We're using 'get' instead of 'getCached' so we don't cache.wrap when we're first adding members to the channel
  return Channel.get(channelId).then(function(item) {
    if (item && item.id) {
      return User.get(userId);
    } else {
      throw new TypeError('This channel doesn\'t exist');
    }
  }).then(function(user) {
    if (user && user.id) {
      return true;
    } else {
      throw new TypeError('This user doesn\'t exist');
    }
  }).then(function() {
    return Member.queryOne('channelId').eq(channelId).where('userId').eq(userId).exec().then(function(item) {
      if (!item || !item.id) {
        newItem = new Member({userId: userId, channelId: channelId, companyId: companyId});
        return newItem.save();
      } else {
        return item;
      }
    });
  }).catch(function(error) {
    console.log('error in addMember', error);
    throw error;
  });
});


ChannelSchema.statics.addCompanyMembers = Promise.method(function(companyId, channelId){
  var Team = dynamoose.model('Team');

  return Team.query('companyId').eq(companyId).exec().then(function(team) {
    return Promise.each(team, function(item){
      return ChannelSchema.statics.addMember(item.userId, channelId, companyId);
    });
  }).catch(function(error) {
    console.log('error in addCompanyMembers', error);
    throw error;
  });
});

var Channel = dynamoose.model('Channel', ChannelSchema);

exports = ChannelSchema;

