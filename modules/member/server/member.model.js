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
  isCreator: Boolean,
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
  console.log('populate: ', _schema);
  var model = dynamoose.model(_schema);
  return model.get(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

MemberSchema.statics.addMember = Promise.method(function(userId, channelId, isCreator){
  var Member = dynamoose.model('Member');
  var item = new Member({userId: userId, channelId: channelId, isCreator: isCreator});
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
      console.log('member: ', members);
      return Promise.map(members, function(val){
        return val.populate('User');
      }).then(function(){
        return members;
      });
    });
  }, {ttl: 60});
}));

dynamoose.model('Member', MemberSchema);
