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
