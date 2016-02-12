'use strict';

/**
 * Module dependencies.
 */
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
  url: {
    type: String,
    default: '',
//    get: function(value){return value + 'test.jpg';},
//    set: function(value){return '';},
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
  var _this = this;
  console.log('link:', config.aws.cloudfront.files );
  _this.cloudfront = {
    url: 'https://' + config.aws.cloudfront.files + '/' + _this.key
  };
});

dynamoose.model('File', FileSchema);

