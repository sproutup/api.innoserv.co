'use strict';

/**
 * Module dependencies.
 */
var Promise = require('bluebird');
var _ = require('lodash');
var debug = require('debug')('up:metrics:model');
var cache = require('config/lib/cache');
var config = require('config/config');
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var moment = require('moment');

/**
 * Schema
 */
var MetricsSchema = new Schema({
  id: {  // ContentId:MetricsType
    type: String,
    hashkey: true
  },
  timestamp: {
    type: Number,
    rangeKey: true,
    required: true,
    default: moment().unix()
  },
  refType: {
    type: String,
    required: true,
    default: 'Service' // Content, Service, etc
  },
  value: {
    type: Number,
    required: true
  }
});

MetricsSchema.static('updateFollowers', Promise.method(function(userId, network, value) {
  var Metrics = dynamoose.model('Metrics');

  return Metrics.update(
    {refId: userId, network: network},
    {$PUT: {
        followers: value,
        updated: Date.now()
      }
    }
  );
}));

MetricsSchema.static('getAll', Promise.method(function(userId) {
  var Metrics = dynamoose.model('Metrics');

  return Metrics.query({refId: userId}).exec().then(function(mtr){
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
/*
MetricsSchema.statics.getUser = Promise.method(function(network, oauth){
  console.log('network - get user', network.provider);
  var accessToken = oauth.accessToken;
  var accessSecret = oauth.accessSecret;

    if(_.isUndefined(oauth)){
      return -1;
    }

    switch(network.provider){
      case 'tw':
        return twitter.verifyCredentials(accessToken, accessSecret)
          .then(function(data){
            return {identifier: data.id,
              name: data.name,
              url: 'https://twitter.com/' + data.screen_name};
        });
      case 'fb':
        return facebook.showUser('me', accessToken).then(function(data){
          return {identifier: data.id,
            name: data.name,
            url: data.link};
        });
      case 'ga':
        return googleAnalytics.showUser(network.identifier, accessToken)
          .then(function(data){
            return {identifier: data.webProperties[0].profiles[0].id,
                 name: data.name,
                 url: data.webProperties[0].websiteUrl};
          });
      case 'yt':
        return youtube.showUser('self', accessToken).then(function(data){
            return {identifier: data.id,
              handle: data.id,
              name: data.snippet.title,
              url: 'https://www.youtube.com/channel/' + data.id};
        });
      case 'ig':
        return instagram.showUser('self', accessToken).then(function(data){
          return {identifier: data.id,
            handle: data.username,
            name: data.full_name,
            url: 'https://www.instagram.com/' + data.username};
        });
      case 'pi':
        return pinterest.showUser('me', accessToken)
          .then(function(data){
            return {identifier: data.id,
              handle: data.username,
              name: data.first_name + ' ' + data.last_name,
              url: data.url};
        });
      default:
        return 0;
    }
});

*/

/**
 * get cached if possible
 **/
MetricsSchema.statics.getCached = Promise.method(function(id) {
  var Metrics = dynamoose.model('Metrics');

//  return cache.wrap(key, function() {
//    debug('cache miss: ', key);
    return Metrics.get(id).then(function(item){
      return item;
    }).catch(function(err){
      debug('err [getCached]: ', err);
      return null;
    });
//  }).then(function(item){
//    debug('get cached: ', item);
//    return item;
//  });
});

dynamoose.model('Metrics', MetricsSchema);

