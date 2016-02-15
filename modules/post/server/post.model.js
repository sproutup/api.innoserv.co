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
var PostSchema = new Schema({
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
      name: 'PostUserIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  groupId: {
    type: String,
    required: false,
    index: {
      global: true,
      rangeKey: 'created',
      name: 'PostGroupIdCreatedIndex',
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
 * Populate method for posts
 */
PostSchema.method('populate', function (_schema, _id) {
  var _this = this;
  console.log('populate: ', _schema);
  var model = dynamoose.model(_schema);
  return model.query('refId').eq(this.id).exec().then(function(items){
    _this[_schema.toLowerCase().trim()] = items;
    return _this;
  });
});

dynamoose.model('Post', PostSchema);

