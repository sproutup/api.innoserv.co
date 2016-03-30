'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
/* global -Promise */
var Promise = require('bluebird');
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');

/**
 * Schema
 */
var CommentSchema = new Schema({
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
      name: 'CommentUserIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  refId: {
    type: String,
    required: false,
    index: {
      global: true,
      rangeKey: 'userId',
      name: 'CommentRefIdUserIdIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  refType: {
    type: String,
    required: false,
    index: {
      global: true,
      rangeKey: 'created',
      name: 'CommentRefTypeCreatedIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  created: {
    type: Date,
    default: Date.now
  },
  body: {
    type: String,
    default: '',
    trim: true,
    required: true
  }
});


/**
 * Populate method
 */
CommentSchema.methods.populate = Promise.method(function (_schema) {
  var _this = this;

  var _attribute = _schema.toLowerCase() + 'Id';
  if (!this[_attribute]) return null;

  console.log('populate: ', _schema);
  var model = dynamoose.model(_schema);
  return model.getCached(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

dynamoose.model('Comment', CommentSchema);
