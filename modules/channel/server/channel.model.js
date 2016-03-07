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
  id: {
    type: String,
    default: function(){ return intformat(flakeIdGen.next(), 'dec'); },
    hashKey: true
  },
  userId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'created',
      name: 'ChannelUserIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  refId: {
    type: String,
    required: false,
    index: {
      global: true,
      rangeKey: 'userId',
      name: 'ChannelRefIdUserIdIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  refType: {
    type: String,
    required: false
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
      return Member.query('channelId').eq(id).exec().then(function(members){
        item.members = members;
        return item;
      });
    });
  });
});

ChannelSchema.statics.createNewChannel = Promise.method(function(userId, refId, refType){
  var _this = this;
  var Channel = dynamoose.model('Channel');
  var Member = dynamoose.model('Member');
  var channel = new Channel({
    userId: userId,
    refId: refId,
    refType: refType
  });

  return channel.save().then(function(val){
    return channel.addMember(userId, val.id);
  }).then(function(member){
    channel.members = [member];
    return channel;
  });
});

ChannelSchema.methods.addMember = Promise.method(function(userId){
  return dynamoose.model('Channel').addMember(userId, this.id);
});

ChannelSchema.statics.addMember = Promise.method(function(userId, channelId, isCreator){
  var Member = dynamoose.model('Member');
  var item = new Member({userId: userId, channelId: channelId, isCreator: isCreator});
  return item.save();
});

ChannelSchema.statics.addCompanyMembers = Promise.method(function(companyId, channelId){
  var Team = dynamoose.model('Team');
  var isCreator = true;

  return Team.query('companyId').eq(companyId).exec().then(function(team) {
    for (var i = 0; i < team.length; i ++) {
      ChannelSchema.statics.addMember(team[i].userId, channelId, isCreator);
    }
  });
});

var Channel = dynamoose.model('Channel', ChannelSchema);

exports = ChannelSchema;

