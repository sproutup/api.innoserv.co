'use strict';

var debug = require('debug')('up:debug:oauth:service');
var config = require('config/config');
var Promise = require('bluebird');
var _ = require('lodash');
var OAuth = require('oauth');
var querystring = require('querystring');
var crypto = require('crypto');
var moment = require('moment');

Promise.promisifyAll(OAuth, {multiArgs: true});

var OAuthService = function(){
  var m = {};
  this.m.key = '';
  this.m.latest = m.key + ':last';
};

var OAuth1 = function(){
  var m = {};
};

var OAuth2 = function(){
  var m = {};
};


//OAuthService.len = function(){
//  return redis.llen(this.m.key);
//};

/**
 * Step 1 : Generate authorization URL
 */
OAuthService.generateAuthURL = function (provider) {
  console.log('[oauth] generate auth url');
  if (_.isUndefined(provider)) {
    return Promise.reject('Invalid provider');
  }
  var params = {
    config: {},
    scope: '',
    provider: provider
  };
  switch(provider){
    case 'ga':
      params.config = config.google;
      params.scope = config.google.scope.ga;
      return OAuth2.getAuthRequestURL(params);
    case 'yt':
      params.config = config.google;
      params.scope = config.google.scope.yt;
      return OAuth2.getAuthRequestURL(params);
    case 'fb':
      params.config = config.facebook;
      params.scope = config.facebook.scope;
      return OAuth2.getAuthRequestURL(params);
    case 'ig':
      params.config = config.instagram;
      params.scope = config.instagram.scope;
      return OAuth2.getAuthRequestURL(params);
    case 'pi':
      params.config = config.pinterest;
      params.scope = config.pinterest.scope;
      return OAuth2.getAuthRequestURL(params);
    case 'tw':
      params.config = config.twitter;
      return OAuth1.getAuthRequestURL(params);
    default:
      return Promise.reject('Invalid provider');
  }
};

/**
 * Step 2 : Get access token
 */
OAuthService.getAccessToken = function (token, provider, tokenSecret, verifier) {
  debug('getAccessToken: ', provider);
  if (_.isUndefined(provider)) {
    return Promise.reject('Invalid provider');
  }
  var params = {
    config: {},
    scope: '',
    provider: provider
  };
  var result = {
    identifier: '',
    handle: '',
    refreshToken: null,
    expires: null,
    accessToken: null,
    accessSecret: null
  };

  switch(provider){
    case 'google':
      config.google.verifier = verifier;
      config.google.tokenSecret = tokenSecret;
      return OAuth2.getAccessToken(token, config.google)
         .then(function(response){
          result.accessToken = response[0];
          result.refreshToken = response[1];
          result.expires = moment().add(response[2].expires_in, 's').valueOf();
          return result;
        });
    case 'yt':
      config.google.verifier = verifier;
      config.google.tokenSecret = tokenSecret;
      return OAuth2.getAccessToken(token, config.google)
         .then(function(response){
           console.log(response);
          result.accessToken = response[0];
          result.refreshToken = response[1];
          result.expires = moment().add(response[2].expires_in, 's').valueOf();
          return result;
        });
    case 'fb':
      config.facebook.verifier = verifier;
      config.facebook.tokenSecret = tokenSecret;
      return OAuth2.getAccessToken(token, config.facebook)
         .then(function(response){
          result.accessToken = response[0];
          result.refreshToken = response[1];
          return result;
        });
    case 'ig':
      config.instagram.verifier = verifier;
      config.instagram.tokenSecret = tokenSecret;
      return OAuth2.getAccessToken(token, config.instagram)
         .then(function(response){
          result.accessToken = response[0];
          result.refreshToken = response[1];
          result.identifier = response[2].user.id;
          result.handle = response[2].user.username;
          return result;
        });
    case 'pi':
      config.pinterest.verifier = verifier;
      config.pinterest.tokenSecret = tokenSecret;
      return OAuth2.getAccessToken(token, config.pinterest)
         .then(function(response){
          result.accessToken = response[0];
          result.refreshToken = response[1];
//          result.identifier = response[2].user.id;
//          result.handle = response[2].user.username;
          return result;
        });
    case 'tw':
      config.twitter.verifier = verifier;
      config.twitter.tokenSecret = tokenSecret;
      return OAuth1.getAccessToken(token, config.twitter)
        .then(function(response){
          result.accessToken = response[0];
          result.accessSecret = response[1];
          result.identifier = response[2].user_id;
          result.handle = response[2].screen_name;
          return result;
        });
    default:
      return Promise.reject('Invalid provider');
  }
};
/*
OAuthService.saveAccessToken = function (userId, provider, accessToken, refreshToken){
  console.log('[oauth] save access token for: ', provider);

  var item = new OAuthModel();

  item.userId = userId;
  item.provider = provider;
  item.accessToken = accessToken;
  item.refreshToken = refreshToken;
  item.status = 1;

  return item.save();
};
*/
OAuthService.refreshAccessToken = function (refreshToken, provider, tokenSecret, verifier) {
  console.log('[oauth] refresh access token for: ', provider, refreshToken);
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
      return OAuth2.refreshAccessToken(refreshToken, config.google)
         .then(function(response){
          result.accessToken = response[0];
          result.expires = moment().add(response[2].expires_in, 's').valueOf();
          return result;
        });
    case 'yt':
      config.google.verifier = verifier;
      config.google.tokenSecret = tokenSecret;
      return OAuth2.refreshAccessToken(refreshToken, config.google)
         .then(function(response){
//          console.log(response);
          result.accessToken = response[0];
          result.expires = moment().add(response[2].expires_in, 's').valueOf();
          return result;
        });
    default:
      return Promise.reject('Invalid provider');
  }
};


/*
 * getRequestToken
 */
OAuth1.getAuthRequestURL = function(params){
  var res = {
    url: '',
    token: '',
    tokenSecret: ''
  };

  var oa = new OAuth.OAuth(
      params.config.requestURL, //  'https://api.twitter.com/oauth/request_token',
      null,
      params.config.clientID, // 'consumerkey',
      params.config.clientSecret, //'consumersecret',
      '1.0',
      params.config.callbackURL, // 'http://localhost:9000/oauth/callback',
      'HMAC-SHA1');

  oa.setClientOptionsAsync({});

  return oa.getOAuthRequestTokenAsync()
    .then(function(item){
      res.token = item[0];
      res.tokenSecret = item[1];
      console.log('[oath1] sign url: ', res);
      return oa.signUrl( params.config.authorizeURL, res.token, res.secret);
    })
    .then(function(url){
      res.url = url;
      return res;
    });
};

/*
 * Compile the request URL
 */
OAuth2.getAuthRequestURL = function(params){
  var res = {
    url: '',
    token: '',
    secret: ''
  };

  var str = {
    'redirect_uri': params.config.callbackURL,
    'response_type': 'code',
    'client_id': params.config.clientID,
    'scope': params.scope,
    'include_granted_scopes': 'true',
    'access_type': 'offline',
    'state': crypto.randomBytes(16).toString('hex')
  };
  res.url = params.config.baseURL + (params.config.requestURL || '/oauth/authorize') + '?' + querystring.stringify(str);
  res.token = str.state;
  res.secret = 'na';

  return Promise.resolve(res);
};

/*
 * Get access token
 */
OAuth1.getAccessToken = function(token, params){
  var OAuth1 = OAuth.OAuth;
  var oauth_token = token;
  var oauth_token_secret = params.tokenSecret;
  var oauth_verifier = params.verifier;


  var oauth1 = new OAuth1(
      params.requestURL, //  'https://api.twitter.com/oauth/request_token',
      params.accessTokenURL,
      params.clientID, // 'consumerkey',
      params.clientSecret, //'consumersecret',
      '1.0A',
      null, //params.callbackURL, // 'http://localhost:9000/oauth/callback',
      'HMAC-SHA1');

  oauth1.setClientOptions({});

  return oauth1.getOAuthAccessTokenAsync(token, params.tokenSecret, params.verifier)
    .then(function(res){
      console.log('[oauth1] access token: ', res);
      return res;
    })
    .catch(function(err){
      console.log('[oauth1] err:', err);
      return err;
    });
};

/*
 * Get access token
 */
OAuth2.getAccessToken = function(token, config){
  var OAuth2 = OAuth.OAuth2;

  var oauth2 = new OAuth2(
      config.clientID,
      config.clientSecret,
      config.baseURL,
      null,
      config.accessTokenURL,
      null);

  var params = {
    //grant_type: 'refresh_token'
    grant_type: config.grant || 'client_credentials',
    redirect_uri: config.callbackURL
  };

//  console.log('url:', oauth2._getAccessTokenUrl());
//  console.log('params:', params);
//  console.log('config:', config);

  return oauth2.getOAuthAccessTokenAsync(config.verifier, params)
    .then(function(res){
      console.log('[OAuth2] got access token');
      return res;
    })
  .catch(function(err){
    console.log(err);
  });
};

/*
 * refresh access token
 */
OAuth2.refreshAccessToken = function(refreshToken, config){
  var OAuth2 = OAuth.OAuth2;

  var oauth2 = new OAuth2(
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
//  console.log('config:', config);

  return oauth2.getOAuthAccessTokenAsync(refreshToken, params)
    .then(function(res){
      console.log('[OAuth2] got access token');
      return res;
    });
};


module.exports = OAuthService;
