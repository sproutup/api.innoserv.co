'use strict';

/**
 * Module dependencies.
 */
var Promise = require('bluebird');
var _ = require('lodash');
var debug = require('debug')('up:service:model');
var cache = require('config/lib/cache');
var config = require('config/config');
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var moment = require('moment');
var errorHandler = require('modules/core/server/errors.controller');

var facebook = require('./facebook.service');
var youtube = require('modules/youtube/server/youtube.service');
var instagram = require('./instagram.service');
var twitter = require('./twitter.service');
var googleplus = require('./googleplus.service');
var googleanalytics = require('./googleanalytics.service');

/**
 * Schema
 */
var ServiceSchema = new Schema({
  id: {
    type: String,
    hashkey: true
  },
  service: {
    type: String,
    rangeKey: true
  },
  provider: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    required: true,
    default: moment().utc().unix()
  },
  identifier: {
    type: String
  },
  username: {
    type: String
  },
  name: {
    type: String
  },
  url: {
    type: String
  },
  picture: {
    type: String
  },
  status: {
    type: Number,
    required: true,
    index: {
      global: true,
      rangeKey: 'timestamp',
      name: 'ServiceStatusTimestampIndex',
      project: true, // ProjectionType: ALL
      throughput: 1 // read and write are both 1
    }
  }
});


ServiceSchema.statics.refresh = Promise.method(function(serviceName, accessToken, userId, accessSecret){
  var _this = this;
  debug('refresh ' + serviceName + ' service');
  switch(serviceName){
    case 'twitter':
      return twitter.verifyCredentials(accessToken, accessSecret)
        .then(function(data){
          debug('twitter user: ' + data.name);
          return _this.updateWrapper(userId, serviceName, {
            provider: 'twitter',
            identifier: data.id,
            username: data.screen_name,
            name: data.name,
            url: data.url,
            picture: data.profile_image_url_https,
            status: 1
          });
      });
    case 'facebook':
      return facebook.showUser('me', accessToken).then(function(data){
        debug('facebook user: ', data.name);
        return _this.updateWrapper(userId, serviceName, {
          provider: 'facebook',
          identifier: data.id,
          name: data.name,
          url: data.link,
          picture: data.picture.data.url,
          status: 1
        });
      });
    case 'youtube':
      return youtube.showUser('self', accessToken).then(function(data){
        debug('youtube title: ', data.snippet.title);
        return _this.updateWrapper(userId, serviceName, {
          provider: 'google',
          identifier: data.id,
          name: data.snippet.title,
          url: data.snippet.customUrl || 'https://www.youtube.com/channel/' + data.id,
          picture: data.snippet.thumbnails.default.url,
          status: 1
        });
      }).catch(function(err){
        debug(serviceName + ' not found for this provider');
        return null;
      });
    case 'googleplus':
      return googleplus.showUser('me', accessToken).then(function(data){
        debug('googleplus name: ', data.displayName);
        return _this.updateWrapper(userId, serviceName, {
          provider: 'google',
          identifier: data.id,
          username: data.nickname,
          name: data.displayName,
          url: data.url,
          picture: data.image.url,
          status: 1
        });
      }).catch(function(err){
        debug(serviceName + ' not found for this provider');
        return null;
      });
    case 'googleanalytics':
      return googleanalytics.showUser('me', accessToken).then(function(data){
        debug('google analytics account: ', data);
        return _this.updateWrapper(userId, serviceName, {
          provider: 'google',
          identifier: data.id,
          username: data.nickname,
          name: data.displayName,
          url: data.url,
          picture: data.image.url,
          status: 1
        });
      }).catch(function(err){
        debug(serviceName + ' not found for this provider');
        return null;
      });
    case 'instagram':
      return instagram.showUser('self', accessToken).then(function(data){
        debug('instagram user: ', data.full_name);
        return _this.updateWrapper(userId, serviceName, {
          provider: 'instagram',
          identifier: data.id,
          username: data.username,
          name: data.full_name,
          url: 'https://www.youtube.com/channel/' + data.id,
          picture: data.profile_picture,
          status: 1
        });
      });
    default:
      return 0;
  }
});

ServiceSchema.static('updateWrapper', Promise.method(function(userId, service, data) {
  data.timestamp = moment().subtract(1,'day').utc().startOf('day').unix();
  return this.update({
    id: userId,
    service: service
  }, data);

}));


ServiceSchema.static('fetchMetricForOldest', function() {
  var _this = this;
  var time = moment().utc().startOf('day').unix();
  return _this.queryOne('status').eq(1).ascending().where('timestamp').lt(time).exec().then(function(val){
    if(val){
      debug('updating expired service ' +  val.service + ' : ' + val.timestamp);
      return _this.update({id: val.id, service: val.service}, {timestamp: time}).then(function(val){
        return val.getMetrics('followers').then(function(metric) {
          debug('metric: ' +  metric.value);
          return metric;
        });
      });
    }
    else{
      return null;
    }
  }).catch(function(err){
    debug(err);
    return err;
  });
});


/**
 * Get Services
 * Look for the services in cache -> db -> fetch from provider
 */
//ServiceSchema.methods.getServices = Promise.method(function(userId, service) {
//  var _this = this;
//  var Metric = dynamoose.model('Metric');
//  var Provider = dynamoose.model('Provider');
//
//  return Service.getCached(this.id, this.service, metric).then(function(val){
//    if(val) {
//      debug('found current metric ' + metric);
//      return val;
//    }
//
//    debug('fetching current metric ' + metric);
//    return Provider.getAccessToken(_this.id, _this.provider).then(function(token){
//      debug('fetch metric...');
//      return Metric.fetch(_this.identifier, _this.service, _this.id, token);
//    });
//  });
//});


/**
 * Get Metrics
 * Look for the metric in cache -> db -> fetch from provider
 */
ServiceSchema.methods.getMetrics = Promise.method(function(metric){
  var _this = this;
  var Metric = dynamoose.model('Metric');
  var Provider = dynamoose.model('Provider');

  debug('get metrics');
  return Metric.getCached(this.id, this.service, metric).then(function(val){
    if(val) {
      debug('found valid local ' + metric + ' metric');
      return val;
    }

    return Provider.getAccessToken(_this.id, _this.provider).then(function(token){
      debug('fetching ' + metric + ' metric');
      return Metric.fetch(_this.identifier, _this.service, _this.id, token);
    });
  });
});

/**
 * Fetch Metrics
 */
ServiceSchema.statics.fetchUserServiceMetrics = Promise.method(function(userId) {
  var _this = this;
  var followers = 0;
  var Provider = dynamoose.model('Provider');

  if (_.isUndefined(userId)) throw new Error('missing required param userId');

  var key = 'service:metric:' + userId;
  return cache.wrap(key, function() {
    debug('fetch service metrics: ' + userId);
    return _this.query('id').eq(userId).exec().then(function(services) {
      if(!services || services.length === 0) {
        debug('...no services found');
        return null;
      }
      return Promise.each(services, function(val, index, length) {
        debug(val.service + ' service ' + (index+1) + ' of ' + length);
        val.metrics = {};
        return val.getMetrics('followers').then(function(metric) {
          val.metrics.followers = metric.value;
          followers += metric.value;
          return val;
        });
      }).then(function(res){
        var srvs = _.keyBy(res, 'service');
        srvs.followers = followers;
        return srvs;
      });
    }).catch(function(err){
      console.log(err);
      return null;
    });
  },{ttl: 60});
});

/**
 * get cached if possible
 **/
ServiceSchema.statics.getCached = Promise.method(function(id) {
  var Service = dynamoose.model('Service');
  var key = 'service:' + id;

  return cache.wrap(key, function() {
    debug('cache miss: ', key);
    return Service.get(id).then(function(item){
      return item || null;
    });
  });
});

dynamoose.model('Service', ServiceSchema);

