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

var InstagramService = function(){
  this.schema = {
    user: {
      id: null,
      followers_count: null,
      friends_count: null,
      statuses_count: null
    }
  };
};

/*
 * Init the api quotas and setup intervals
 */
InstagramService.init = function(){
  console.log('instagram service init');
};

InstagramService.showUser = function(id, token){
  var options = {
    uri: 'https://api.instagram.com/v1/users/' + id,
    qs: {access_token: token},
    json: true
  };
//  console.log('options:', options);
  return request(options).then(function(response){
    var user = {
      id: response.data.id,
      followers: response.data.counts.followed_by,
      friends: response.data.counts.follows,
      statuses: response.data.counts.media
    };
//    console.log('updating instagram stats: ', user);
//      redis.hmset('twitter:user:'+id, user);
    return response.data;
  })
  .catch(function(err){
    console.log('Error: ', err);
    throw err;
  });
};

module.exports = InstagramService;
