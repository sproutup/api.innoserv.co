'use strict';

/**
 * Module dependencies.
 */
 /* global -Promise */
var Promise = require('bluebird');
var _ = require('lodash');
var debug = require('debug')('up:slug:model');
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
var SlugSchema = new Schema({
  id: {
    type: String,
    trim: true,
    lowercase: true,
    hashKey: true
  },
  orig: {
    type: String,
    trim: true,
    required: true
  },
  refId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'created',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  refType: {
    type: String,
    default: '',
    trim: true,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

/**
 * Check if slug is available
 */
SlugSchema.static('available', Promise.method(function(id) {
  var Slug = dynamoose.model('Slug');
  return Slug.getCached().then(function(item){
    return _.isUndefined(item);
  });
}));

SlugSchema.static('createWrapper', Promise.method(function(body) {
  var Slug = dynamoose.model('Slug');
  body.orig = body.id;
  return Slug.create(body).then(function(item) {
    return item;
  }).catch(function(err){
    debug('err: ', err);
    throw err;
  });
}));

/**
 * get cached if possible
 **/
SlugSchema.statics.getCached = Promise.method(function(id) {
  var Slug = dynamoose.model('Slug');
  var key = 'slug:' + id.toLowerCase().trim();

  return cache.wrap(key, function() {
    debug('cache miss: ', key);
    return Slug.get(id).then(function(item){
      return item;
    }).catch(function(err){
      debug('err: ', err);
      return null;
    });
  });
});

dynamoose.model('Slug', SlugSchema);

