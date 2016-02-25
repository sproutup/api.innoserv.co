'use strict';

/**
 * Module dependencies.
 */

/* global -Promise */
var Promise = require('bluebird');

var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');

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
      rangeKey: 'created',
      name: 'ChannelRefIdUserIdIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
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

ChannelSchema.statics.addMember = Promise.method(function(userId, channelId){
  var Member = dynamoose.model('Member');
  var item = new Member({userId: userId, channelId: channelId});
  return item.save();
});

ChannelSchema.statics.addCompanyMembers = Promise.method(function(companyId, channelId){
  var Team = dynamoose.model('Team');
  return Team.query('companyId').eq(companyId).exec().then(function(team) {
    for (var i = 0; i < team.length; i ++) {
      ChannelSchema.statics.addMember(team[i].userId, channelId);
    }
  });
});

dynamoose.model('Channel', ChannelSchema);