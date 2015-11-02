'use strict';

/**
 *  * Module dependencies.
 *   */
var dynamoose = require('config/lib/dynamoose');
var Schema = dynamoose.Schema;

/**
 *  * User Reach Schema
 *   */
var UserReachSchema  = new Schema({
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
  value: Number
},
{
  throughput: {read: 15, write: 5}
});

dynamoose.model('UserReach', UserReachSchema);
