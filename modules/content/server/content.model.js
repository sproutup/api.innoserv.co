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
    index: [{
      global: true,
      rangeKey: 'media',
      name: 'ContentCampaignMediaIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    },
    {
      global: true,
      rangeKey: 'userId',
      name: 'ContentCampaignUserIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }]
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
  }
});

dynamoose.model('Content', ContentSchema);