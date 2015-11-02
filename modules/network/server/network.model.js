'use strict';

/**
 *  * Module dependencies.
 *   */
var dynamoose = require('config/lib/dynamoose');
var Schema = dynamoose.Schema;

/**
 *  * User Reach Schema
 *   */
var NetworkSchema  = new Schema({
  userId: {
    type: Number,
    validate: function(v) { return v > 0; },
    hashKey: true
  },
  provider: {
    type: String,
    rangeKey: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    index: {
      global: true,
      project: true
    }
  },
  'tokenSecret': String,
  'verifier': String,
  'accessToken': String,
  'accessSecret': String,
  'refreshToken:': String,
  'identifier': String,
  'handle': String,
  'status': {
    type: Number,
    default: 0
  }
},
{
  throughput: {read: 15, write: 5}
});

dynamoose.model('Network', NetworkSchema);
