'use strict';

/**
 *  * Module dependencies.
 *   */
var dynamoose = require('config/lib/dynamoose');
var Schema = dynamoose.Schema;

/*
 * Youtube Channel Schema
 */
var YoutubeChannelSchema  = new Schema({
  userId: {
    type: Number,
    validate: function(v) { return v > 0; },
    hashKey: true
  },
  channelId: {
    type: String,
    rangeKey: true
  },
  title: String,
  description: String,
  published_at: String,
  thumbnail_url: String,
  banner_image_url: String
},
{
  throughput: {read: 5, write: 1}
});

module.exports = dynamoose.model('YoutubeChannel', YoutubeChannelSchema);
