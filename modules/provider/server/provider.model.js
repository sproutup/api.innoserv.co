'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var config = require('config/config');
var debug = require('debug')('up:debug:provider:model');
var Promise = require('bluebird');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var _ = require('lodash');
var moment = require('moment');
var OAuth = require('oauth');

var oauthService = require('modules/oauth/server/oauth.service.js');

/**
 * Schema
 */
var ProviderSchema = new Schema({
  id: {
    type: String,
    default: function(){ return intformat(flakeIdGen.next(), 'dec'); },
    rangeKey: true
  },
  provider: {
    type: String,
    hashKey: true
  },
  userId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'provider',
      name: 'ProviderUserIdProviderIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  created: {
    type: Date,
    default: Date.now
  },
  data: {}
});

ProviderSchema.statics.getAccessToken = Promise.method(function(userId, provider){
  var _this = this;
  var _provider = provider;
  debug('getAccessToken: userId:', userId);
  debug('getAccessToken: provider: ', provider);

  // change to google if provider is a google service
  if(provider==='ga' || provider === 'yt' || provider === 'g+'){
    _provider = 'google';
  }

  // update the account
  return _this.queryOne('userId').eq(userId).where('provider').eq(_provider).exec()
    .then(function(item){
      if(!_.isUndefined(item.data.expires) && moment().isAfter(item.data.expires)){
        debug('token expired');
        return _this.refreshAccessToken(userId, provider).then(function(token){
          return token.data.accessToken;
        });
      }
      debug('token expires ', moment(item.data.expires).fromNow());
      return item.data.accessToken;
    })
    .catch(function(err){
      console.log('[OAuth model] get access: ', err);
      throw err;
    });
});

ProviderSchema.statics.refreshAccessToken = Promise.method(function(userId, provider){
  var Provider = dynamoose.model('Provider');
  var _this = this;
  var _result = null;
  var _provider = provider;

  debug('refreshAccessToken: user: ', userId, ' provider ', provider);
  // change to google if provider is a google service
  if(provider==='ga' || provider === 'yt' || provider === 'g+'){
    _provider = 'google';
  }

  return _this.queryOne('userId').eq(userId).where('provider').eq(_provider).exec()
    .then(function(provider){
      if(_.isUndefined(provider)){
        throw new Error('Provider not found');
      }
      else{
        _result = provider;
        debug('[OAuth] refresh provider: ', provider.provider);
        return provider;
      }
    })
    .then(function(provider){
      debug('Oauthservice: ', provider.provider);
      return _this.refreshAccessTokenOAuth2(provider.data.refreshToken, provider.provider, '', '');
    })
    .then(function(access){
      debug('[network] refresh access token: ', access.accessToken);
      _result.data.accessToken = access.accessToken;
      _result.data.expires = access.expires;
      _result.data.accessSecret = access.accessSecret;
      debug('provider id: ', _result.id);
      return Provider.update(
        {provider: _result.provider, id: _result.id},
        {$PUT: {
          data: _result.data,
          status: 1}});
    })
    .catch(function(err){
      console.log('ups error: ', err);
      _this.update(
        {provider: _result.provider, id: _result.id},
        {$PUT: {status: -1}});
      throw err;
    });
});


ProviderSchema.statics.refreshAccessTokenOAuth2 = Promise.method(function (refreshToken, provider, tokenSecret, verifier) {
  var _this = this;
  debug('refresh access token for: ', provider, refreshToken);
  if (_.isUndefined(provider)) {
    return Promise.reject('Invalid provider');
  }
  var params = {
    config: {},
    scope: '',
    provider: provider
  };
  var result = {
    accessToken: null,
    expires: null,
    accessSecret: null
  };

  switch(provider){
    case 'google':
      config.google.verifier = verifier;
      config.google.tokenSecret = tokenSecret;
      return _this.getOAuthAccessTokenAsync(refreshToken, config.google)
         .then(function(response){
          result.accessToken = response[0];
          result.expires = moment().add(response[2].expires_in, 's').valueOf();
          return result;
        });
    default:
      return Promise.reject('Invalid provider');
  }
});

/*
 * refresh access token
 */
ProviderSchema.statics.getOAuthAccessTokenAsync = Promise.method(function(refreshToken, config){
  var oauth2 = new OAuth.OAuth2(
      config.clientID,
      config.clientSecret,
      config.baseURL,
      null,
      config.accessTokenURL,
      null);

  var params = {
    grant_type: 'refresh_token'
  };

//  console.log('url:', oauth2._getAccessTokenUrl());
//  console.log('params:', params);
//  debug('config:', config);

  return oauth2.getOAuthAccessTokenAsync(refreshToken, params)
    .then(function(res){
      debug('got refreshed access token');
      return res;
    })
  .catch(function(err){
    console.log(err);
    throw err;
  });
});


/**
 * Populate method
 */
ProviderSchema.method('populate', function (_schema) {
  var _this = this;
  var _attribute = _schema.toLowerCase() + 'Id';
  console.log('populate: ', _schema);
  var model = dynamoose.model(_schema);
  return model.get(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

dynamoose.model('Provider', ProviderSchema);
