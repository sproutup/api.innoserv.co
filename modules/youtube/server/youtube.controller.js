'use strict';

/**
 * Module dependencies.
 */

var dynamoose = require('dynamoose');
var debug = require('debug')('up:debug:youtube:ctrl');
var Network = dynamoose.model('Network');
var Provider = dynamoose.model('Provider');
var Promise = require('bluebird');
var youtubeService = require('./youtube.service');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');

/**
 * Show
 */
exports.listVideosByUser = function (req, res) {
  res.json([]);
};

/**
 * Video List
 */
exports.listVideos = function (req, res) {
  console.log('[Youtube] list videos');
  var maxResults = 10;

  var result = {
    total: 0,
    resultsPerPage: maxResults,
    items : []
  };

  Promise.join(
      //Network.get({userId: req.userId, provider: 'yt'}),
      Provider.getAccessToken(req.userId, 'google'),
      function(accessToken){
        return youtubeService.search(accessToken, 'id, snippet', maxResults);
      }
    )
    .then(function(data){
      result.items = data.items;
      result.total = data.items.length;
      res.json(result);
    })
    .catch(function(err){
      res.json(err);
    });
};

/**
 * My video List
 */
exports.listMyVideos = function (req, res) {
  debug('listMyVideos: ', req.user.displayName);
  var maxResults = 10;

  var result = {
    total: 0,
    resultsPerPage: maxResults,
    items : []
  };

  Promise.join(
      //Network.get({userId: req.userId, provider: 'yt'}),
      Provider.getAccessToken(req.user.id, 'google'),
      function(accessToken){
        debug('accessToken: ', accessToken);
        return youtubeService.search(accessToken, 'id, snippet', maxResults);
      }
    )
    .then(function(data){
      result.items = data.items;
      result.total = data.items.length;
      res.json(result);
    })
    .catch(function(err){
      res.json(err);
    });
};


