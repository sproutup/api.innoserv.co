'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var debug = require('debug')('up:debug:provider:model');
var Promise = require('bluebird');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var _ = require('lodash');
var moment = require('moment');

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
    .then(function(provider){
      debug('provider: ', provider.data.accessToken);
      if(!_.isUndefined(provider.data.expires) && moment().isAfter(provider.data.expires)){
        debug('[oauth] token expired');
        return _this.refreshAccessToken(userId, provider).then(function(token){
          return token;
        });
      }
      debug('[oauth] token expires', moment(provider.data.expires).fromNow());
      return provider.data.accessToken;
    })
    .catch(function(err){
      console.log('[OAuth model] get access: ', err);
      throw err;
    });
});

ProviderSchema.statics.refreshAccessToken = Promise.method(function(userId, provider){
  var _this = this;
  var _result = null;
  var _provider = provider;

  // change to google if provider is a google service
  if(provider==='ga' || provider === 'yt' || provider === 'g+'){
    _provider = 'google';
  }

  return _this.queryOne('userId').eq(userId).where('provider').eq(_provider).exec()
    .then(function(provider){
      if(_.isUndefined(provider)){
        throw new Error('[OAuth] not found');
      }
      else{
        _result = provider;
        console.log('[OAuth] refresh provider: ', provider.provider);
        return provider;
      }
    })
    .then(function(provider){
      console.log('Oauthservice: ', provider);
      return oauthService.refreshAccessToken(provider.data.refreshToken, provider.provider, '', '');
    })
    .then(function(access){
      console.log('[network] refresh access token: ', access.accessToken);
      _result.data.accessToken = access.accessToken;
      _result.data.expires = access.expires;
      _result.data.accessSecret = access.accessSecret;

      return _this.update(
        {userId: _result.userId, provider: _result.provider},
        {$PUT: {
          data: _result.data,
          status: 1}});
    })
    .catch(function(err){
      console.log('ups error: ', err);
      _this.update(
        {userId: _result.userId, provider: _result.provider},
        {$PUT: {status: -1}});
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
