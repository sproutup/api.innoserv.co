'use strict';

/**
 * Module dependencies.
 */
var Promise = require('bluebird');
var _ = require('lodash');
var debug = require('debug')('up:metrics:model');
var cache = require('config/lib/cache');
var config = require('config/config');
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');

/**
 * Schema
 */
var MetricsSchema = new Schema({
  refId: {
    type: String,
    hashkey: true
  },
  network: {
    rangeKey: true,
    type: String
  },
  refType: {
    type: String,
    required: true,
    default: 'User'
  },
  created: {
    type: Date,
    default: Date.now
  },
  followers: {
    type: Number,
    default: 0
  }
});

MetricsSchema.static('updateFollowers', Promise.method(function(userId, network, value) {
  var Metrics = dynamoose.model('Metrics');

  return Metrics.update({refId: userId, network: network}, {$PUT: {followers: value}});
}));

MetricsSchema.static('getAll', Promise.method(function(userId) {
  var Metrics = dynamoose.model('Metrics');

  return Metrics.query({refId: userId}).exec().then(function(mtr){
    var result = {
      followers:{
        total: 0
      }
    };
    var total = 0;
    _.forEach(mtr, function(val){
      result.followers[val.network] = val.followers;
      result.followers.total += val.followers;
    });
    return result;
  });
}));


/**
 * get cached if possible
 **/
MetricsSchema.statics.getCached = Promise.method(function(id) {
  var Metrics = dynamoose.model('Metrics');

//  return cache.wrap(key, function() {
//    debug('cache miss: ', key);
    return Metrics.get(id).then(function(item){
      return item;
    }).catch(function(err){
      debug('err [getCached]: ', err);
      return null;
    });
//  }).then(function(item){
//    debug('get cached: ', item);
//    return item;
//  });
});

dynamoose.model('Metrics', MetricsSchema);

