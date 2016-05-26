'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
/* global -Promise */
var Promise = require('bluebird');

/**
 * Schema
 */
var TeamSchema = new Schema({
  userId: {
    type: String,
    hashKey: true
  },
  companyId: {
    type: String,
    rangeKey: true,
    required: true,
    index: {
      global: true,
      rangeKey: 'userId',
      name: 'CompanyProductIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  created: {
    type: Date,
    default: Date.now
  }
});

/**
 * Populate method
 */
TeamSchema.methods.populate = Promise.method(function (_schema) {
  var _this = this;

  var _attribute = _schema.toLowerCase() + 'Id';
  if (!this[_attribute]) return null;

  var model = dynamoose.model(_schema);
  return model.getCached(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

/**
 * Add member method
 */
TeamSchema.statics.addTeamMember = Promise.method(function (userId, companyId) {
  var Team = dynamoose.model('Team');
  var member = {
    userId: userId,
    companyId: companyId
  };

  return Team.create(member);
});

/**
 * Remove member method
 */
TeamSchema.statics.removeMember = Promise.method(function (userId, companyId) {
  var Team = dynamoose.model('Team');
  return Team.delete({ companyId: companyId, userId: userId });
});

/*
TeamSchema.statics.queryByUser = Promise.method(function(userId){
  var key = 'user:' + userId + ':companies';
  var promises = [];

  return redis.zrevrange(key, 0, -1).then(function(companies){
    return Promise.map(companies, function(companyId) {
      return Company.getCached(companyId);
    });
  });
});
*/
dynamoose.model('Team', TeamSchema);
