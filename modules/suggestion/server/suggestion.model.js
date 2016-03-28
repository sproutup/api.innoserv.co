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
var SuggestionSchema = new Schema({
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
      name: 'ContentUserMediaIndex',
      rangeKey: 'created',
      project: true, // ProjectionType: ALL
      throughput: 2 // read and write are both 5
    }
  },
  created: {
    type: Date,
    default: Date.now
  },
  url: {
    type: String,
    trim: true,
    required: true
  },
  name: {
    type: String,
    default: '',
    trim: true,
    required: true
  }
});

/**
 * Populate method
 */
SuggestionSchema.method('populate', function (_schema, _id) {
  var _this = this;
  var _attribute = _schema.toLowerCase() + 'Id';
  console.log('populate: ', _schema);
  var model = dynamoose.model(_schema);
  return model.get(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

dynamoose.model('Suggestion', SuggestionSchema);
