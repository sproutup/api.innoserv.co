'use strict';

var debug = require('debug')('up:debug:youtubeAnalytics:service');
var moment = require('moment'),
    redis = require('config/lib/redis'),
    Promise = require('bluebird');
var request = require('request-promise');

var YoutubeAnalyticsService = function(){
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
 */
YoutubeAnalyticsService.init = function(){
  debug('youtube analytics service init');
};

YoutubeAnalyticsService.query = function(id, channel, token){
  debug('query:', id);
  var start = moment().subtract(10,'year').utc().startOf('day').format('YYYY-MM-DD');
  var options = {
    uri: 'https://www.googleapis.com/youtube/analytics/v1/reports',
    qs: {
      ids: 'channel==' + channel,
      'start-date': start,
      'end-date': moment().utc().format('YYYY-MM-DD'),
      metrics: 'views,likes,comments,shares,averageViewDuration', //,audienceWatchRatio',
      filters: 'video==' + id,
      access_token: token
    },
    json: true
  };

  return request(options).then(function(response){
    return response;
  });
};

YoutubeAnalyticsService.queryByDay = function(id, channel, token, startdate){
  debug('query by day:', id);

  var start = moment().subtract(10,'year').utc().startOf('day').format('YYYY-MM-DD');
  var finish = moment().subtract(1,'day').utc().format('YYYY-MM-DD'); // yesterday

  var options = {
    uri: 'https://www.googleapis.com/youtube/analytics/v1/reports',
    qs: {
      ids: 'channel==' + channel,
      'start-date': start,
      'end-date': finish,
      metrics: 'views,likes,comments,shares,estimatedMinutesWatched',
      dimensions: 'day',
      filters: 'video==' + id,
      access_token: token
    },
    json: true
  };

  console.log(options);

  return request(options).then(function(response){
    return response;
  });
};


module.exports = YoutubeAnalyticsService;
