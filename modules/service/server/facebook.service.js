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

var FacebookService = function(){
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
FacebookService.init = function(){
  console.log('facebook service init');

//  setInterval(LinkedAccount.process, moment.duration(1, 's').asMilliseconds());

//  Promise.join( 
//      TwitterService.quotaStatusesShowReset(), 
//      TwitterService.quotaStatusesRetweetsReset(),
//      function(statuses, retweets){
//        setInterval(TwitterService.quotaStatusesShowReset, moment.duration(1, 'm').asMilliseconds());
//        setInterval(TwitterService.quotaStatusesRetweetsReset, moment.duration(1, 'm').asMilliseconds());
//     }
//  );
};

FacebookService.showUser = function(id, token){
  var options = {
    uri: 'https://graph.facebook.com/me?fields=id,name,email,friends,verified,link,picture',
    qs: {access_token: token},
    json: true
  };
//  console.log('options:', options);
  return request(options).then(function(response){
//    console.log('facebook: ', response);
    return response;
  })
  .catch(function(err){
    console.log('Error: ', err);
    return {err: err};
  });
};

module.exports = FacebookService;
