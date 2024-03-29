'use strict';

/**
 * Module dependencies.
 */
/* global -Promise */
var Promise = require('bluebird');
var _ = require('lodash');
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var cache = require('config/lib/cache');
var debug = require('debug')('up:debug:member:model');

/**
 * Schema
 */
var MemberSchema = new Schema({
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
      rangeKey: 'channelId',
      name: 'MemberUserIdChannelIdIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  channelId: {
    type: String,
    required: false,
    index: {
      global: true,
      rangeKey: 'userId',
      name: 'MemberChannelIdUserIdIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  companyId: {
    type: String
  },
  created: {
    type: Date,
    default: Date.now
  }
});

/**
 * late method
 */
MemberSchema.method('populate', function (_schema) {
  var _this = this;
  var _attribute = _schema.toLowerCase() + 'Id';
  var model = dynamoose.model(_schema);
  return model.getCached(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

MemberSchema.statics.addMember = Promise.method(function(userId, channelId, companyId){
  var Member = dynamoose.model('Member');
  var item = new Member({userId: userId, channelId: channelId, companyId: companyId});
  return item.save();
});

/**
 * query by company
 */
MemberSchema.static('queryByChannel', Promise.method(function(channelId){
  var Member = dynamoose.model('Member');
  var key = 'channel:' + channelId + ':members';

  return cache.wrap(key, function() {
    return Member.query('channelId').eq(channelId).exec().then(function(members){
      return Promise.map(members, function(val){
        return val.populate('User');
      }).then(function(){
        return members;
      });
    });
  }, {ttl: 60});
}));

dynamoose.model('Member', MemberSchema);
