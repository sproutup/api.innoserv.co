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
var ContentSchema = new Schema({
  id: {
    type: String,
    default: function(){ return intformat(flakeIdGen.next(), 'dec'); },
    hashKey: true
  },
  // unique id from source media
  ref: {
    type: String
  },
  // tw, ig, yt, pi etc...
  media: {
    type: String,
    trim: true,
    required: true,
    index: {
      global: true,
      rangeKey: 'ref',
      name: 'ContentMediaRefIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  userId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'media',
      name: 'ContentUserMediaIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  campaignId: {
    type: String,
    required: false,
    index: {
      global: true,
      rangeKey: 'userId',
      name: 'ContentCampaignUserIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  created: {
    type: Date,
    default: Date.now
  },
  title: {
    type: String,
    default: '',
    trim: true,
    required: true
  },
  impressions: {
    type: Number,
    default: 0
  },
  engagements: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  }
});

/**
 * Populate method for posts
 */
ContentSchema.method('populate', function (_schema, _id) {
  var _this = this;
  var _attribute = _schema.toLowerCase() + 'Id';
  console.log('populate: ', _schema);
  var model = dynamoose.model(_schema);
  return model.get(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

dynamoose.model('Content', ContentSchema);

