'use strict';

/**
 * Module dependencies.
 */

/* global -Promise */
var Promise = require('bluebird');
var _ = require('lodash');
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var redis = require('config/lib/redis');
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var cache = require('config/lib/cache');

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
  console.log('populate: ', _schema);
  var model = dynamoose.model(_schema);
  return model.get(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

ChannelSchema.statics.populateLatestMessage = Promise.method(function(channel){
  var key = 'channel:' + channel.id + ':messages';
  return redis.zrevrange(key, 0, 0).then(function(val){
    if(val[0]){
      channel.last = JSON.parse(val[0]);
    }
    console.log('not found');
    return;
  });
});

ChannelSchema.statics.queryByUser = Promise.method(function(userId){
  var key = 'user:' + userId + ':channel:feed';
  var promises = [];

  return redis.zrevrange(key, 0, -1).then(function(channels){
    _.forEach(channels, function(channelId){
      var key = 'user:' + channelId + ':channel:feed';
      promises.push(Channel.getCached(channelId).then(function(channel){
          return channel;
        })
      );
    });
    return Promise.map(channels, function(channelId) {
      var key = 'user:' + channelId + ':channel:feed';
      console.log('mapping: ', key);
      return Channel.getCached(channelId);
    });
  });
});


ChannelSchema.statics.getCached = Promise.method(function(id){
  var Channel = dynamoose.model('Channel');
  var Member = dynamoose.model('Member');
  var key = 'channel:' + id;

  return cache.wrap(key, function() {
    console.log('cache miss: channel');
    return Channel.get(id).then(function(item){
      if(_.isUndefined(item)) return item;
      return Member.queryByChannel(id).then(function(members){
        item.members = _.keyBy(members, 'id');
        return item;
      }).then(function(item){
        if(!item.refType) return item;
        var model = dynamoose.model(item.refType);
        return model.getCached(item.refId).then(function(model){
          item.ref = model;
          return item;
        });
      });
    });
  });
});

ChannelSchema.statics.createNewChannel = Promise.method(function(userId, id, type){
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
    return channel.addMember(userId, true);
  }).then(function(member){
    channel.members = [member];
    return channel;
  });
});

ChannelSchema.statics.createCampaignChannel = Promise.method(function(userId, campaignId){
  var _userId;
  var _channel;
  var Campaign = dynamoose.model('Campaign');

  var channelKey = campaignId + ':' + userId;
  return Channel.createNewChannel(userId, channelKey, 'Campaign:User').then(function(ch){
    // Get company ID so we can call addCompanyUsers
    _channel = ch;
    return Campaign.get(campaignId);
   }).then(function(campaign) {
    // Add company members to the message channel
    return Channel.addCompanyMembers(campaign.companyId, _channel.id);
  }).then(function() {
    return _channel;
  });
});

ChannelSchema.methods.addMember = Promise.method(function(userId, isCreator){
  return dynamoose.model('Channel').addMember(userId, this.id, isCreator);
});

ChannelSchema.statics.addMember = Promise.method(function(userId, channelId, isCreator){
  if (!userId) {
    throw new TypeError('A user is required to start a channel.');
  } else if (!channelId) {
    throw new TypeError('A channel is required to start a channel.');
  }

  var Channel = dynamoose.model('Channel');
  var Member = dynamoose.model('Member');

  // Make sure the channel exists
  // Then make sure this user isn't already added to the channel
  // If we're good, save the member
  return Channel.getCached(channelId).then(function(item) {
    if (item && item.id) {
      return;
    } else {
      throw new TypeError('This channel doesn\'t exist');
    }
  }).then(function() {
    return Member.queryOne('channelId').eq(channelId).where('userId').eq(userId).exec().then(function(item) {
      if (!item || !item.id) {
        var newItem = new Member({userId: userId, channelId: channelId, isCreator: isCreator});
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
  var isCreator = true;

  return Team.query('companyId').eq(companyId).exec().then(function(team) {
    return Promise.each(team, function(item){
      return ChannelSchema.statics.addMember(item.userId, channelId, isCreator);
    });
  }).catch(function(error) {
    console.log('error in addCompanyMembers', error);
    throw error;
  });
});

var Channel = dynamoose.model('Channel', ChannelSchema);

exports = ChannelSchema;

