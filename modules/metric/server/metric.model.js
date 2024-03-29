'use strict';

/**
 * Module dependencies.
 */
var Promise = require('bluebird');
var _ = require('lodash');
var debug = require('debug')('up:metric:model');
var cache = require('config/lib/cache');
var elasticsearch = require('config/lib/elasticsearch');
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
  userId: {
    type: String
  },
  contentId: {
    type: String
  },
  campaignId: {
    type: String
  },
  companyId: {
    type: String
  },
  value: {
    type: Number,
    required: true
  }
});

MetricSchema.statics.updateYoutubeMetrics = Promise.method(function(videoId, channelId, service, accessToken, userId, contentId, campaignId, companyId){
  var _this = this;
  debug('update youtube metrics');
  return youtubeAnalytics.query(videoId, channelId, accessToken).then(function(data){
    if(data.rows){
      debug('youtube analytics value: ', data.rows);
      return Promise.join(
        _this.updateWrapper(videoId + ':' + 'youtube:views', 'Content:Service:Metric', 'totalViews', data.rows[0][0], moment(1000), userId, contentId, campaignId, companyId),
        _this.updateWrapper(videoId + ':' + 'youtube:likes', 'Content:Service:Metric', 'totalLikes', data.rows[0][1], moment(1000), userId, contentId, campaignId, companyId),
        _this.updateWrapper(videoId + ':' + 'youtube:comments', 'Content:Service:Metric', 'totalComments', data.rows[0][2], moment(1000), userId, contentId, campaignId, companyId),
        _this.updateWrapper(videoId + ':' + 'youtube:shares', 'Content:Service:Metric', 'totalShares', data.rows[0][3], moment(1000), userId, contentId, campaignId, companyId),
        _this.updateWrapper(videoId + ':' + 'youtube:averageViewDuration', 'Content:Service:Metric', 'totalAverageViewDuration', data.rows[0][4], moment(1000), userId, contentId, campaignId, companyId),
        function(){
          return 1;
        }
      );
    }
  });
});

MetricSchema.statics.updateYoutubeDailyMetrics = Promise.method(function(videoId, channelId, service, accessToken, userId, contentId, campaignId, companyId){
  var _this = this;
  debug('update youtube daily metrics');
  return youtubeAnalytics.queryByDay(videoId, channelId, accessToken).then(function(data){
    if(data.rows){
      debug('youtube daily analytics value: ', data.rows);
      return Promise.each(data.rows, function(item){
        var day = moment(item[0], 'YYYY-MM-DD');
        debug('youtube values: ', item);
        debug('day: ', day);
        return Promise.join(
          _this.updateWrapper(contentId + ':' + 'youtube:day:views', 'Content:Service:Dimension:Metric', 'views', item[1], day, userId, contentId, campaignId, companyId),
          _this.updateWrapper(contentId + ':' + 'youtube:day:likes', 'Content:Service:Dimension:Metric', 'likes', item[2], day, userId, contentId, campaignId, companyId),
          _this.updateWrapper(contentId + ':' + 'youtube:day:comments', 'Content:Service:Dimension:Metric', 'comments', item[3], day, userId, contentId, campaignId, companyId),
          _this.updateWrapper(contentId + ':' + 'youtube:day:shares', 'Content:Service:Dimension:Metric', 'shares', item[4], day, userId, contentId, campaignId, companyId),
          _this.updateWrapper(contentId + ':' + 'youtube:day:estimatedMinutesWatched', 'Content:Service:Dimension:Metric', 'estimatedMinutesWatched', item[5], day, userId, contentId, campaignId, companyId),
          function(){
            return 1;
          }
        );
      });
    }
    else{
      console.log('no data found: ', data);
      return 0;
    }
  });
});


MetricSchema.statics.getYoutubeMetrics = Promise.method(function(videoId){
  var _this = this;
  debug('get youtube metrics');

  return Promise.join(
    _this.getCached(videoId, 'youtube', 'views'),
    _this.getCached(videoId, 'youtube', 'likes'),
    _this.getCached(videoId, 'youtube', 'comments'),
    _this.getCached(videoId, 'youtube', 'shares'),
    _this.getCached(videoId, 'youtube', 'averageViewDuration'),
    function(views, likes, comments, shares, duration){
      return {
        views: views || {value: 0},
        likes: likes || {value: 0},
        comments: comments || {value: 0},
        shares: shares || {value: 0},
        averageViewDuration: duration || {value: 0}
      };
    }
  );
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
              'followers',
              data.followers_count,
              moment(1000),
              userId);
      }).catch(function(err){
          debug('err: ', err);
      });
    case 'facebook':
      return facebook.showUser('me', accessToken).then(function(data){
        debug('facebook user: ', data.name);
        return _this.updateWrapper(
          userId + ':' + serviceName + ':followers',
          'User:Service:Metric',
          'followers',
          data.friends ? data.friends.summary.total_count : 0,
          moment(1000),
          userId);
      });
    case 'youtube':
      return youtube.showUser('self', accessToken).then(function(data){
        debug('youtube value: ', data.statistics.subscriberCount);
        var subscriberCount = _this.updateWrapper(
          userId + ':' + serviceName + ':followers',
          'User:Service:Metric',
          'followers',
          data.statistics.subscriberCount,
          moment(1000),
          userId);
        var viewCount = _this.updateWrapper(
          userId + ':' + serviceName + ':viewCount',
          'User:Service:Metric',
          'viewCount',
          data.statistics.viewCount,
          moment(1000),
          userId);
        var videoCount = _this.updateWrapper(
          userId + ':' + serviceName + ':videoCount',
          'User:Service:Metric',
          'videoCount',
          data.statistics.videoCount,
          moment(1000),
          userId);
        return Promise.join(subscriberCount, viewCount, videoCount, function(sub, view, video){
          return [sub, view, video]; 
        });
      });
    case 'googleplus':
      return googleplus.showUser('me', accessToken).then(function(data){
        debug('googleplus value: ', data.circledByCount);
        return _this.updateWrapper(
          userId + ':' + serviceName + ':followers',
          'User:Service:Metric',
          'followers',
          data.circledByCount,
          moment(1000),
          userId);
     });
    case 'googleanalytics':
      return googleanalytics.showUser('me', accessToken).then(function(data){
        debug('google analytics account: ', data);
        return _this.updateWrapper(
          userId + ':' + serviceName + ':followers',
          'User:Service:Metric',
          'followers',
          data.friends.summary.total_count,
          moment(1000),
          userId);
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
          'followers',
          data.counts.followed_by,
          moment(1000),
          userId);
      });
    default:
      return 0;
  }
});

MetricSchema.static('updateWrapper', Promise.method(function(id, type, metric, value, timestamp, userId, contentId, campaignId, companyId) {
  if(!value || value===0){
    return 0;
  }

  if (!timestamp){
    timestamp = moment().utc().startOf('day');
  }

  debug('update ' + id + ' == ' + value + ' time:' + timestamp.unix());
  cache.del(id);
  return this.update({
    id: id,
    timestamp: timestamp.unix()
  }, {
    refType: type,
    userId: userId,
    name: metric,
    contentId: contentId,
    campaignId: campaignId,
    companyId: companyId,
    value: value
  }).then(function(obj){
    return elasticsearch.index({
      index: 'metric',
      type: metric,
      id: obj.id + ':' + obj.timestamp,
      body: {
        id: id,
        userId: userId,
        contentId: contentId,
        campaignId: campaignId,
        companyId: companyId,
        type: type,
        name: metric,
        value: value,
        timestamp: timestamp.format('YYYY-MM-DD')
      }
    });
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
//  var timestamp = moment().utc().startOf('day').unix();
  var timestamp = moment(1000).utc().unix();

  return cache.wrap(key, function() {
    debug('cache miss: ', key);
    return _this.get({id: key, timestamp: timestamp}).then(function(val){
      return val || null;
    });
  },{ttl: 60});
});

dynamoose.model('Metric', MetricSchema);

