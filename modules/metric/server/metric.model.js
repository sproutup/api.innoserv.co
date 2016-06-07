'use strict';

/**
 * Module dependencies.
 */
var Promise = require('bluebird');
var _ = require('lodash');
var debug = require('debug')('up:metric:model');
var cache = require('config/lib/cache');
var config = require('config/config');
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var moment = require('moment');

var facebook = require('modules/service/server/facebook.service');
var youtube = require('modules/youtube/server/youtube.service');
var youtubeAnalytics = require('modules/service/server/youtubeAnalytics.service');
var instagram = require('modules/service/server/instagram.service');
var twitter = require('modules/service/server/twitter.service');
var googleplus = require('modules/service/server/googleplus.service');
var googleanalytics = require('modules/service/server/googleanalytics.service');

/**
 * Schema
 */
var MetricSchema = new Schema({
  id: {  // refId:Service:Metric
    type: String,
    hashkey: true
  },
  timestamp: {
    type: Number,
    rangeKey: true,
    required: true,
    default: moment().utc().startOf('day').unix()
  },
  name: {
    type: String
  },
  refType: {
    type: String,
    required: true,
    default: 'User' // Content, Service, User etc
  },
  value: {
    type: Number,
    required: true
  }
});

MetricSchema.statics.updateYoutubeMetrics = Promise.method(function(videoId, channelId, service, accessToken){
  var _this = this;
  debug('update youtube metrics');
  return youtubeAnalytics.query(videoId, channelId, accessToken).then(function(data){
    if(data.rows){
      debug('youtube analytics value: ', data.rows);
      return Promise.join(
        _this.updateWrapper(videoId + ':' + 'youtube' + ':views', 'Content:Service:Metric', data.rows[0][0]),
        _this.updateWrapper(videoId + ':' + 'youtube' + ':likes', 'Content:Service:Metric', data.rows[0][1]),
        _this.updateWrapper(videoId + ':' + 'youtube' + ':comments', 'Content:Service:Metric', data.rows[0][2]),
        _this.updateWrapper(videoId + ':' + 'youtube' + ':shares', 'Content:Service:Metric', data.rows[0][3]),
        _this.updateWrapper(videoId + ':' + 'youtube' + ':averageViewDuration', 'Content:Service:Metric', data.rows[0][4]),
        function(){
          return 1;
        }
      );
    }
  });
});

MetricSchema.statics.fetch = Promise.method(function(identifier, serviceName, userId, accessToken){
  var _this = this;
  debug('fetch metrics for ' + serviceName + ' service');
  switch(serviceName){
    case 'twitter':
      return twitter.showUser(identifier, accessToken.token, accessToken.secret)
        .then(function(data){
          debug('twitter user: ' + data.name);
          return _this.updateWrapper(
              userId + ':' + serviceName + ':followers',
              'User:Service:Metric',
              data.followers_count);
      }).catch(function(err){
          debug('err: ', err);
      });
    case 'facebook':
      return facebook.showUser('me', accessToken).then(function(data){
        debug('facebook user: ', data.name);
        return _this.updateWrapper(
          userId + ':' + serviceName + ':followers',
          'User:Service:Metric',
          data.friends ? data.friends.summary.total_count : 0);
      });
    case 'youtube':
      return youtube.showUser('self', accessToken).then(function(data){
        debug('youtube value: ', data.statistics.subscriberCount);
        return _this.updateWrapper(
          userId + ':' + serviceName + ':followers',
          'User:Service:Metric',
          data.statistics.subscriberCount);
      });
    case 'googleplus':
      return googleplus.showUser('me', accessToken).then(function(data){
        debug('googleplus value: ', data.circledByCount);
        return _this.updateWrapper(
          userId + ':' + serviceName + ':followers',
          'User:Service:Metric',
          data.circledByCount);
     });
    case 'googleanalytics':
      return googleanalytics.showUser('me', accessToken).then(function(data){
        debug('google analytics account: ', data);
        return _this.updateWrapper(
          userId + ':' + serviceName + ':followers',
          'User:Service:Metric',
          data.friends.summary.total_count);
     }).catch(function(err){
        debug(serviceName + ' not found for this provider');
        return null;
      });
    case 'instagram':
      return instagram.showUser('self', accessToken).then(function(data){
        debug('instagram user: ', data.full_name);
        return _this.updateWrapper(
          userId + ':' + serviceName + ':followers',
          'User:Service:Metric',
          data.counts.followed_by);
      });
    default:
      return 0;
  }
});

MetricSchema.static('updateWrapper', Promise.method(function(id, type, value) {
  var timestamp = moment().utc().startOf('day').unix();
  debug('update ' + id + ' == ' + value);
  cache.del(id);
  return this.update({
    id: id,
    timestamp: timestamp
  }, {
    refType: type,
    value: value
  });

}));

MetricSchema.static('updateFollowers', Promise.method(function(userId, network, value) {
  var Metric = dynamoose.model('Metric');

  return Metric.update(
    {refId: userId, network: network},
    {$PUT: {
        followers: value,
        updated: Date.now()
      }
    }
  );
}));

MetricSchema.static('getAll', Promise.method(function(userId) {
  var Metric = dynamoose.model('Metric');

  return Metric.query({refId: userId}).exec().then(function(mtr){
    var result = {
      followers:{
        total: 0
      }
    };
    var total = 0;
    _.forEach(mtr, function(val){
      result.followers[val.network] = val.followers;
      result.followers.total += val.followers;
    });
    return result;
  });
}));


/**
 * get cached if possible
 **/
MetricSchema.statics.getCached = Promise.method(function(userId, service, metric) {
  var _this = this;
  var key = userId + ':' + service + ':' + metric;
  var timestamp = moment().utc().startOf('day').unix();

  return cache.wrap(key, function() {
    debug('cache miss: ', key);
    return _this.get({id: key, timestamp: timestamp}).then(function(val){
      return val || null;
    });
  },{ttl: 3600});
});

dynamoose.model('Metric', MetricSchema);

