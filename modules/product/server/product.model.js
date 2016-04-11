'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var Promise = require('bluebird');
var cache = require('config/lib/cache');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');

/**
 * Schema
 */
var ProductSchema = new Schema({
  id: {
    type: String,
    default: function(){ return intformat(flakeIdGen.next(), 'dec'); },
    hashKey: true
  },
  companyId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'id',
      name: 'CompanyProductIndex',
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
  tagline: {
    type: String,
    default: '',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  video: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    trim: true
  }
});

ProductSchema.statics.getCached = Promise.method(function(id){
  var Product = dynamoose.model('Product');
  var key = 'product:' + id;
  var _item;

  return cache.wrap(key, function() {
    return Product.get(id);
  });
});


dynamoose.model('Product', ProductSchema);
