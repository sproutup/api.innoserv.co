'use strict';

/**
 *  * Module dependencies.
 *   */
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var Promise = require('bluebird');
var oauthService = require('modules/oauth/server/oauth.service.js');
var moment = require('moment');
var _ = require('lodash');

/**
 * OAuth Schema
 **/
var OAuthSchema = new Schema({
  userId: {
    type: Number,
    hashKey: true
  },
  provider: {
    type: String,
    rangeKey: true
  },
//  token: {
//    type: String,
//    required: true,
//    index: {
//      global: true,
//      project: true
//    }
//  },
//  'tokenSecret': String,
//  'verifier': String,
  'accessToken': String,
  'accessSecret': String,
  'refreshToken': String,
  'expires': Number,
  'status': {
    type: Number,
    default: 0
  },
  'message': String
},
{
  throughput: {read: 15, write: 5}
});

OAuthSchema.statics.saveAccessToken = Promise.method(function(userId, provider, access){
  var _this = this;
  var _provider = provider;
  console.log('[OAuth model] save access', access);

  // change to google if provider is a google service
  if(provider==='ga' || provider === 'yt' || provider === 'g+'){
    _provider = 'google';
  }

  // update the account
  return _this.update(
    {userId: userId, provider: _provider},
    {$PUT: { accessToken: access.accessToken,
             refreshToken: access.refreshToken,
             expires: access.expires,
             accessSecret: access.accessSecret,
             status: 1}})
    .catch(function(err){
      console.log('[OAuth model] save access: ', err);
      throw err;
    });
});

OAuthSchema.statics.getAccessToken = Promise.method(function(userId, provider){
  var _this = this;
  var _provider = provider;

  // change to google if provider is a google service
  if(provider==='ga' || provider === 'yt' || provider === 'g+'){
    _provider = 'google';
  }

  // update the account
  return _this.get({userId: userId, provider: _provider})
    .then(function(data){
      if(!data) {
        return null;
      }
      if(data.expires && moment().isAfter(data.expires)){
        console.log('[oauth] token expired');
        return _this.refreshAccessToken(userId, provider).then(function(data){
          return data;
        });
      }
      return data;
    });
});

OAuthSchema.statics.refreshAccessToken = Promise.method(function(userId, provider){
  var _this = this;
  var _result = null;
  var _provider = provider;

  // change to google if provider is a google service
  if(provider==='ga' || provider === 'yt' || provider === 'g+'){
    _provider = 'google';
  }

  return _this.get({userId: userId, provider: _provider})
    .then(function(result){
      if(_.isUndefined(result)){
        throw new Error('[OAuth] not found');
      }
      else{
        _result = result;
        console.log('[OAuth] refresh provider: ', result.provider);
        return result;
      }
    })
    .then(function(item){
      console.log('Oauthservice: ', item);
      return oauthService.refreshAccessToken(item.refreshToken, item.provider, '', '');
    })
    .then(function(access){
      console.log('[network] refresh access token: ', access.accessToken);
      return _this.update(
        {userId: _result.userId, provider: _result.provider},
        {$PUT: {
           accessToken: access.accessToken,
           expires: access.expires,
           accessSecret: access.accessSecret,
           status: 1}});
    });
//    .catch(function(err){
//      console.log('ups error: ', err);
//      _this.update(
//        {userId: _result.userId, provider: _result.provider},
//        {$PUT: {status: -1}});
//      throw err;
//    });
});


dynamoose.model('oauth', OAuthSchema);

