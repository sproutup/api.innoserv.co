'use strict';

var debug = require('debug')('up:debug:googleplus:service');
var moment = require('moment');
var redis = require('config/lib/redis');
var Promise = require('bluebird');
var request = require('request-promise');

// GET /users/user-id                 Get basic information about a user. To get information about the owner of the access token, you can use self instead of the user-id.
// GET /users/self/feed               See the authenticated user's feed.
// GET /users/user-id/media/recent    Get the most recent media published by a user. To get the most recent media published by the owner of the access token, you can use self instead of the user-id.
// GET /users/self/media/liked        See the authenticated user's list of liked media.
// GET /users/search                  Search for a user by name.

var GooglePlusService = function(){
};

/*
 * Init the api quotas and setup intervals
 */
GooglePlusService.init = function(){
  debug('google plus service init');
};

GooglePlusService.showUser = function(id, token){
  debug('showUser:', id);
  var options = {
    uri: 'https://www.googleapis.com/plus/v1/people/me',
    qs: {
      access_token: token
    },
    json: true
  };

  return request(options);
};


GooglePlusService.search = function(token, part, maxResults){
  debug('search');
  var options = {
    uri: 'https://www.googleapis.com/youtube/v3/search',
    qs: {
      access_token: token,
      part: 'id,snippet',
      type: 'video',
      forMine: true,
      maxResults: maxResults
    },
    json: true
  };

  return request(options).then(function(response){
    return response;
  })
  .catch(function(err){
    console.log('Error: ', err);
    return {err: err};
  });
};


module.exports = GooglePlusService;
