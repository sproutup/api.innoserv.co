'use strict';

var debug = require('debug')('up:debug:youtube:service');
var moment = require('moment'),
    redis = require('config/lib/redis'),
    Promise = require('bluebird');
//var CronJob = require('cron').CronJob;
var request = require('request-promise');

// GET /users/user-id                 Get basic information about a user. To get information about the owner of the access token, you can use self instead of the user-id.
// GET /users/self/feed               See the authenticated user's feed.
// GET /users/user-id/media/recent    Get the most recent media published by a user. To get the most recent media published by the owner of the access token, you can use self instead of the user-id.
// GET /users/self/media/liked        See the authenticated user's list of liked media.
// GET /users/search                  Search for a user by name.

var YoutubeService = function(){
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
YoutubeService.init = function(){
  debug('youtube service init');

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

YoutubeService.showUser = function(id, token){
  debug('showUser:', id);
  var options = {
    uri: 'https://www.googleapis.com/youtube/v3/channels',
    qs: {
      access_token: token,
      part: 'id,snippet,statistics',
      mine: true
    },
    json: true
  };
  
  return request(options).then(function(response){
/*    var user = {
      id: response.data.id,
      followers: response.data.counts.followed_by,
      friends: response.data.counts.follows,
      statuses: response.data.counts.media
    };*/
//    console.log('updating youtube stats: ', response.items);
//      redis.hmset('twitter:user:'+id, user);
    return response.items[0];
  })
  .catch(function(err){
    console.log('Error: ', err);
    return {err: err};
  });
};


YoutubeService.search = function(token, part, maxResults){
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


module.exports = YoutubeService;
