'use strict';

var oauth2Client = require('config/lib/googleapi');
var redis = require('config/lib/redis');
var AnalyticsAccount = require('modules/analyticsAccount/server/analyticsAccount.model.js');
var googleapi = require('googleapis');
/* global -Promise */
var Promise = require('bluebird');
var analytics = googleapi.analytics('v3');
var youtube = googleapi.youtube('v3');

Promise.promisifyAll(youtube.channels);

var YoutubeAnalyticsService = function(){
};

YoutubeAnalyticsService.init = function(){
  console.log('youtube analytics service init');
/*  Promise.join( 
      TwitterService.quotaStatusesShowReset(), 
      TwitterService.quotaStatusesRetweetsReset(),
      function(statuses, retweets){
        setInterval(TwitterService.quotaStatusesShowReset, moment.duration(1, 'm').asMilliseconds());
        setInterval(TwitterService.quotaStatusesRetweetsReset, moment.duration(1, 'm').asMilliseconds());
     }
  );*/
};

/*
 * extraxt an event from a status received from twitter api
 */
YoutubeAnalyticsService.extractEvent = function(status){
  var data = {
    counter : status.user.followers_count,
    date_dim_id : 260,
    user_id : 1,
    provider_dim_id : 3, // twitter:
    metrics_dim_id : 4 // followers 
  };

  return data;
};

YoutubeAnalyticsService.quotaDecr = function(){
  return redis.decr('quota:youtube:analytics:units');
};

YoutubeAnalyticsService.quotaReset = function(){
  // google analytics
  // 50,000 requests per project per day = approx 34.72 per minute
  // max 1 per second
//  Quota summary
//
//  Daily quota resets at midnight Pacific Time (PT).
//  Free quota
//  50,000,000 units/day
//  Remaining
//
//  50,000,000 units/day
//  100% of total
//
//  Per-user limit
//  3,000 requests/second/user  
//  youtube 5M points per day = approx 3470 per min

  return redis.set('quota:google:analytics:units', 180000);
};
/*
TwitterService.setFlag = function(id){
  return redis.sadd('analytics:tweet:flag', id);
};

TwitterService.getFlag = function(id){
  return redis.sismember('analytics:tweet:flag', id);
};
*/

YoutubeAnalyticsService.getChannels = function(){
  return youtube.channels
    .listAsync({auth: oauth2Client, part: 'id,snippet,statistics,brandingSettings', mine: 'true'})
    .then(function(result){return result;})
    .catch(function(err){
      console.log('err: ', err.errors[0].message);
      throw err;
    });
};

YoutubeAnalyticsService.getVideos = function(){
  return youtube.videos
    .listAsync({auth: oauth2Client, part: 'id,snippet,statistics', mine: 'true'})
    .then(function(result){ return result; })
    .catch(function(err){
      console.log('err: ', err.errors[0].message);
      return [];
    });
};

YoutubeAnalyticsService.updateChannel = function(channel, user_id) {

  var values = {
    id: channel.id,
    user_id: user_id,
    name: channel.snippet.title,
    views: channel.statistics.viewCount,
    subscribers: channel.statistics.subscriberCount
  };

  return redis.hmset('youtube:channel:' + channel.id, values)
    .then(function(){
      return redis.sadd('youtube:channels:user:' + user_id, channel.id);
    });
};

YoutubeAnalyticsService.process = function(item) {
  var _self = this;
  console.log('youtube handler: ', item.id);
  AnalyticsAccount.getByUserId(item.user_id)
    .then(function(result){
      console.log('result:', result);
        //console.log(result.username);
    })  
    .then(function(res){
      _self.getChannels();
    })
    .map(function(channel){
        return this.updateChannel(channel, item.user_id);
    })
    .catch(function(err){
      console.log('err:', err);
      return 'err';
    });
};

module.exports = YoutubeAnalyticsService;
