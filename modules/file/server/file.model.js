'use strict';

/**
 * Module dependencies.
 */
 /* global -Promise */
var Promise = require('bluebird');
var _ = require('lodash');
var cache = require('config/lib/cache');
var config = require('config/config');
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var debug = require('debug')('up:debug:file:model');

/**
 * Schema
 */
var FileSchema = new Schema({
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
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    default: '',
    trim: true,
    required: true
  },
  bucket: {
    type: String,
    default: '',
    trim: true
  },
  key: {
    type: String,
    default: '',
    trim: true
  },
  type: {
    type: String,
    default: '',
    trim: true
  },
  size: {
    type: Number,
    default: 0
  }
});

/**
 * Add cloudfront links
 */
FileSchema.method('addCloudfront', function () {
  this.url = 'https://' + config.aws.cloudfront.files + '/' + this.key;
  debug('addCloudfront', this.url);
  return this;
});

FileSchema.statics.getCached = Promise.method(function(id){
  var File = dynamoose.model('File');
  var key = 'file:' + id;

  if(_.isUndefined(id)) return null;

  return cache.wrap(key, function() {
    debug('cache miss: file ', key);
    return File.get(id).then(function(item){
      if(_.isUndefined(item)) {
        debug('file not found');
        return null;
      }
      item.addCloudfront('companyId');
      return item;
    });
  });
});


dynamoose.model('File', FileSchema);
