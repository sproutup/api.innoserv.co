'use strict';

/**
 * Module dependencies.
 */
var path = require('path');
var dynamoose = require('config/lib/dynamoose');
var YoutubeChannel = dynamoose.model('YoutubeChannel');

/**
 * List
 */
exports.list = function (req, res) {
  YoutubeChannel.scan().exec().then(function(items) {
    console.log('youtube channels', items);
    res.json(items);
  })
  .catch(function(err){
    res.json(err);
  });
};
