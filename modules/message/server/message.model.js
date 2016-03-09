'use strict';

/**
 * Module dependencies.
 */
/* global -Promise */
var Promise = require('bluebird');
var dynamoose = require('dynamoose');
var redis = require('config/lib/redis');
var cache = require('config/lib/cache');
var moment = require('moment');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var _ = require('lodash');

/**
 * Schema
 */
var MessageSchema = new Schema({
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
      name: 'MessageUserIdCreatedIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  channelId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'created',
      name: 'MessageChannelIdCreatedIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  created: {
    type: Date,
    default: Date.now
  },
  body: {
    type: String,
    default: '',
    trim: true,
    required: true
  }
});

MessageSchema.statics.getCached = Promise.method(function(id){
  var Message = dynamoose.model('Message');
  var key = 'message:' + id;

  return cache.wrap(key, function() {
    console.log('cache miss: message');
    return Message.get(id).then(function(item){
      if(_.isUndefined(item)) return item;
      return item.populate('User');
    });
  });
});


MessageSchema.statics.getChannelMessages = Promise.method(function(channelId){
  var Message = dynamoose.model('Message');
  var Channel = dynamoose.model('Channel');
  var key = 'channel:' + channelId + ':messages';
  var res = {
    messages: [],
    channel: {}
  };

  return redis.exists(key).then(function(val) {
    console.log('cache exists: ', val);
    if(val===1){
      return redis.zrange(key, 0, -1).map(function(val){
        return JSON.parse(val);
      });
    }
    else{
      return Message.query('channelId').eq(channelId).exec().then(function(items){
        return Promise.map(items, function(val){
          return redis.zadd(key, moment(val.created).unix(), JSON.stringify(val)).then(function(){
            return val;
          });
        });
      });
    }
  }).then(function(messages){
    res.messages = messages;
    return Channel.getCached(channelId);
  }).then(function(channel){
    res.channel = channel;
    return res;
  });
});


/**
 * Each user has a channel feed with a list of that users channels.
 * List is sorted by last message received
 */
MessageSchema.method('updateMembersChannelFeed', Promise.method(function (ttl) {
  var Channel = dynamoose.model('Channel');
  var _this = this;
  var promises = [];

  // update channel feed for members

  console.log('cache: ', _this.id);
  return Channel.getCached(_this.channelId).then(function(channel){
    console.log('channel: ', channel.id);
    _.forEach(channel.members, function(member){
      var key = 'user:' + member.userId + ':channel:feed';
      console.log('update channel feed for member: ', member.userId, moment(_this.created).unix(), _this.channelId);
      promises.push(redis.zadd(key, moment(_this.created).unix(), _this.channelId));
    });
    return Promise.all(promises).then(function() {
      console.log('done');
      return true;
    });
  });
})
);


/**
 * Each user has a channel feed with a list of that users channels.
 * List is sorted by last message received
 */
MessageSchema.method('addMessageToChannel', Promise.method(function (ttl) {
  var _this = this;
  var key = 'channel:' + _this.channelId + ':messages';

  redis.zadd(key, moment(_this.created).unix(), JSON.stringify(_this));
})
);


/**
 * Populate method
 */
MessageSchema.method('populate', function (_schema) {
  var _this = this;
  var _attribute = _schema.toLowerCase() + 'Id';
  console.log('populate: ', _schema);
  var model = dynamoose.model(_schema);
  return model.get(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

dynamoose.model('Message', MessageSchema);
