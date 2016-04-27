'use strict';

var moment = require('moment');
var redis = require('config/lib/redis');
var Promise = require('bluebird');
var request = require('request-promise');

// GET /users/user-id                 Get basic information about a user. To get information about the owner of the access token, you can use self instead of the user-id.
// GET /users/self/feed               See the authenticated user's feed.
// GET /users/user-id/media/recent    Get the most recent media published by a user. To get the most recent media published by the owner of the access token, you can use self instead of the user-id.
// GET /users/self/media/liked        See the authenticated user's list of liked media.
// GET /users/search                  Search for a user by name.

var GoogleAnalyticsService = function(){
};

/*
 * Init the api quotas and setup intervals
 */
GoogleAnalyticsService.init = function(){
  console.log('google analytics service init');
};

GoogleAnalyticsService.getReach = function(id, token){
  var options = {
    uri: 'https://www.googleapis.com/analytics/v3/data/ga',
    qs: {
      access_token: token,
      ids: 'ga:'+id,
      'start-date': '91daysAgo',
      'end-date': 'yesterday',
      metrics: 'ga:sessions'
//      dimensions: 'ga:month'
    },
    json: true
  };
  console.log('options:', options);
  return request(options).then(function(data){
    console.log(data);
    return data.rows[0];
  })
  .catch(function(err){
    console.log('Error: ', err);
    throw {code: err.error.error.code, message: err.error.error.message};
  });

};

GoogleAnalyticsService.showUser = function(id, token){
  var options = {
    uri: 'https://www.googleapis.com/analytics/v3/management/accountSummaries',
    qs: {
      access_token: token,
      part: 'id,snippet,statistics',
      mine: true
    },
    json: true
  };
  return request(options).then(function(response){
    return response.items[0];
  });
};

module.exports = GoogleAnalyticsService;
