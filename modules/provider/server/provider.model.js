'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var cache = require('config/lib/cache');
var config = require('config/config');
var debug = require('debug')('up:debug:provider:model');
var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt'));
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
  timestamp: {
    type: Number,
    required: true,
    default: moment().utc().unix()
  },
  status: {
    type: Number,
    default: 1,
    required: true,
    index: {
      global: true,
      rangeKey: 'timestamp',
      name: 'ProviderStatusTimestampIndex',
      project: true, // ProjectionType: ALL
      throughput: 1 // read and write are both 1
    }
  },
  data: {}
});

/**
 * Refresh metrics by providers
 */
//ProviderSchema.statics.refreshProviderMetrics = Promise.method(function (userId) {
//  var res = [];
//  if (_.isUndefined(userId)) throw {err: 'missing required param userId'};
//
//  debug('refresh provider metrics: ', userId);
//  return this.query('userId').eq(userId).exec().then(function(provider){
//    return Promise.each(provider, function(val, index, length){
//      debug('provider ' + (index+1) + ' of ' + length + ':' + val.provider);
//      return val.refreshMetrics().then(function(o){
//        res.push(o);
//      });
//    });
//  }).then(function(){
//    return _.flatten(res);
//  });
//});
//
//ProviderSchema.methods.refreshMetrics = Promise.method(function(){
//  var Provider = dynamoose.model('Provider');
//  var Metrics = dynamoose.model('Metrics');
//  var _this = this;
//
//  if(_this.status !== 1 && false){
//    console.log('Provider is not connected');
//    return 0;
//  }
//
//  debug('refresh services for ' + _this.provider);
//
//  switch(_this.provider){
//    case 'twitter':
//      return Metrics.fetch(_this.provider, _this.data.token, _this.userId, _this.data.tokenSecret);
//    case 'google':
//      return _this.getAccessToken().then(function(accessToken){
//        return Promise.join(
//          Metrics.fetch('youtube', accessToken, _this.userId),
//          Metrics.fetch('google+', accessToken, _this.userId),
//          Metrics.fetch('google.analytics', accessToken, _this.userId)
//        );
//      });
//    default:
//      return Metrics.fetch(_this.provider, _this.data.accessToken, _this.userId);
//  }
//});

ProviderSchema.static('fetchServiceForOldest', function() {
  var _this = this;
  var time = moment().utc().startOf('day').unix();
  return _this.queryOne('status').eq(1).ascending().where('timestamp').lt(time).exec().then(function(val){
    if(val){
      debug('updating expired provider ' +  val.provider + ' : ' + val.timestamp);
      return _this.update({id: val.id, provider: val.provider}, {timestamp: time}).then(function(val){
        return val.refreshServices(true).then(function(services) {
          debug('services updated');
          return services;
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
 * Refresh list of services by providers
 */
ProviderSchema.statics.refreshProviderServices = Promise.method(function (userId) {
  var res = [];
  if (_.isUndefined(userId)) throw {err: 'missing required param userId'};

  debug('refresh provider services: ', userId);
  return this.query('userId').eq(userId).exec().then(function(provider){
    return Promise.each(provider, function(val, index, length){
      debug('provider ' + (index+1) + ' of ' + length + ':' + val.provider);
      return val.refreshServices().then(function(o){
        res.push(o);
      });
    });
  }).then(function(){
    return _.flatten(res);
  });
});

ProviderSchema.methods.refreshServices = Promise.method(function(delCachedValue){
  var Provider = dynamoose.model('Provider');
  var Service = dynamoose.model('Service');
  var _this = this;
  var key = 'services:provider:' + _this.provider + ':user:' + _this.id;

  if(delCachedValue){
    cache.del(key);
  }

  return cache.wrap(key, function() {
    if(_this.status !== 1 && false){
      console.log('Provider is not connected');
      return 0;
    }

    debug('refresh services for ' + _this.provider);

    switch(_this.provider){
      case 'twitter':
        return Service.refresh(_this.provider, _this.data.token, _this.userId, _this.data.tokenSecret);
      case 'google':
        return _this.getAccessToken().then(function(accessToken){
          return Promise.join(
            Service.refresh('youtube', accessToken, _this.userId),
            Service.refresh('googleplus', accessToken, _this.userId)
  //          Service.refresh('googleanalytics', accessToken, _this.userId)
          );
        });
      default:
        return Service.refresh(_this.provider, _this.data.accessToken, _this.userId);
    }
  },{ttl: 3600});
});

/*
ProviderSchema.methods.getFollowers = Promise.method(function(network, oauth){
  console.log('getFollowers', network, oauth);

  if(this.status !== 1 && false){
    console.log('cant get reach when network is not connected');
    return 0;
  }
  else{
    switch(network.provider){
      case 'tw':
        return twitter.verifyCredentials(oauth.accessToken, oauth.accessSecret)
          .then(function(data){
            console.log('show user: ', data);
            return data.followers_count;
        });
      case 'fb':
        return facebook.showUser('me', oauth.accessToken).then(function(data){
          console.log('show user: ', data);
          return data.friends.summary.total_count;
        });
      case 'ga':
        return googleAnalytics.getReach(network.identifier, oauth.accessToken)
          .then(function(data){
            console.log('show reach: ', data);
            return Math.ceil(data[0]/3);
          });
      case 'yt':
        return youtube.showUser('self', oauth.accessToken).then(function(data){
          console.log('show user: ', data);
          return data.statistics.subscriberCount;
        });
      case 'ig':
        return instagram.showUser('self', oauth.accessToken).then(function(data){
          console.log('show user: ', data);
          return data.counts.followed_by;
        });
      case 'pi':
        return pinterest.showUser('me', oauth.accessToken).then(function(data){
          console.log('show user: ', data);
          return data.counts.followers;
        });
      default:
        return 0;
    }
  }
});
*/

/**
 * Create instance method for hashing a password
 */
ProviderSchema.methods.hashPassword = Promise.method(function (password) {
  var _this = this;

  if (password) {
    return bcrypt.hashAsync(password, 10).then(function(hash){
      // Store hash in your password DB.
      debug('password hashed: ', hash);
      _this.data.hash = hash;
      return hash;
    });
  } else {
    return password;
  }
});

/**
 * Create static method for hashing a password
 */
ProviderSchema.statics.hashPassword = Promise.method(function (password) {
  if (_.isUndefined(password)) throw {err: 'missing required param password'};

  return bcrypt.hashAsync(password, 10).then(function(hash){
    debug('generated hash: ', hash);
    return hash;
  });
});


/**
 * Create instance method for authenticating user
 */
ProviderSchema.methods.authenticate = Promise.method(function (password) {
  return bcrypt.compareAsync(password, this.data.hash);
});

ProviderSchema.statics.createPassword = Promise.method(function(email, password, userId) {
  var Provider = dynamoose.model('Provider');

  return Promise.try(function(){
    // create password provider if needed
    if(_.isUndefined(email) || _.isUndefined(password) || _.isUndefined(userId)) {
      debug('missing param', email, password, userId);
      throw new Error('missing required param');
    }
    debug('create hash');
    return Provider.hashPassword(password);
  }).then(function(hash){
    debug('create password provider for user: ', userId);
    return Provider.create({
      id: email,
      password: password,
      userId: userId,
      provider: 'password',
      data: {
        hash: hash
      }
    });
  }).catch(function(err){
    debug('createPassword: ', err.stack);
    throw err;
  });
});

ProviderSchema.methods.changePassword = Promise.method(function(password) {
  var _this = this;

  return Promise.try(function(){
    // create password provider if needed
    if(_.isUndefined(password)) {
      debug('missing param', password);
      throw new Error('missing required param');
    }
    debug('create hash');
    return _this.hashPassword(password);
  }).then(function(hash){
    debug('save password provider for user: ', _this.userId);
    return _this.save();
  }).catch(function(err){
    debug('createPassword: ', err.stack);
    throw err;
  });
});

ProviderSchema.statics.getAccessToken = Promise.method(function(userId, provider){
  var _this = this;
  var _provider = provider;
  debug('get ' + provider + ' access token');

  // update the account
  return _this.queryOne('userId').eq(userId).where('provider').eq(_provider).exec()
    .then(function(item){
      if(!_.isUndefined(item.data.expires)) {
        if(moment().isAfter(item.data.expires)){
          debug('token expired');
          return _this.refreshAccessToken(userId, provider).then(function(token){
            return token.data.accessToken;
          });
        }
        else{
          debug('token expires ', moment(item.data.expires).fromNow());
        }
      }
      if(provider==='twitter'){
        return {
          token: item.data.token,
          secret: item.data.tokenSecret
        };
      }
      else{
        return item.data.accessToken;
      }
    })
    .catch(function(err){
      console.log('[OAuth model] get access: ', err);
      throw err;
    });
});

ProviderSchema.methods.getAccessToken = Promise.method(function(){
  var _this = this;

  debug('get access token for ', _this.provider);

  // update the account
  if(!_.isUndefined(_this.data.expires) && moment().isAfter(_this.data.expires)){
    debug('token expired ' + moment(_this.data.expires).toNow());
    return _this.refreshAccessToken().then(function(token){
      return token.data.accessToken;
    });
  }
  debug(_this.provider + ' token expires ' + moment(_this.data.expires).fromNow());
  return _this.data.accessToken;
});

ProviderSchema.methods.refreshAccessToken = Promise.method(function(){
  var Provider = dynamoose.model('Provider');
  var _this = this;
  var _result = null;

  debug('refresh access token: ', _this.provider);

  return Provider.refreshAccessTokenOAuth2(_this.data.refreshToken, _this.provider, '', '')
    .then(function(access){
      _this.data.accessToken = access.accessToken;
      _this.data.expires = access.expires;
      _this.data.accessSecret = access.accessSecret;
      debug('update provider with fresh token: ' + _this.provider);
      console.log(access);
      return Provider.update(
        {provider: _this.provider, id: _this.id},
        {$PUT: {
          data: _this.data,
          status: 1}});
    })
    .catch(function(err){
      console.log('token refresh error: ', err);
      _this.update(
        {provider: _result.provider, id: _result.id},
        {$PUT: {status: -1}});
      throw err;
    });
});

ProviderSchema.statics.refreshAccessToken = Promise.method(function(userId, provider){
  var Provider = dynamoose.model('Provider');
  var _this = this;
  var _result = null;
  var _provider = provider;

  debug('refresh access token ' + provider);
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
          console.log('oauth2: ', response);
          result.accessToken = response;
          result.expires = moment().utc().add(3600, 's').valueOf();
          return result;
        });
    default:
      return Promise.reject('Invalid provider');
  }
});

ProviderSchema.statics.add = Promise.method(function(data) {
  var _this = this;
});

ProviderSchema.methods.purge = Promise.method(function() {
  var Service = dynamoose.model('Service');
  var _this = this;

  debug('purge: ', this.id);
  return Service.query('id').eq(this.userId)
    .filter('provider').eq(this.provider).exec().then(function(items) {
    if(_.isUndefined(items)) return 0;
    debug('purge ' + items.length + ' items');
    // delete all user providers
    return Promise.each(items, function(item){
      debug('delete ', item.id , ' service: ', item.service);
      return Service.delete({id: item.id, service: item.service});
    });
  }).then(function(){
    return _this.delete();
  }).catch(function(err){
    debug('err', err.stack);
    throw err;
  });
});


ProviderSchema.statics.purge = Promise.method(function(userId) {
  var _this = this;

  debug('purge: ', userId);
  return _this.query('userId').eq(userId).exec().then(function(items) {
    if(_.isUndefined(items)) return true;

    // delete all user providers
    return Promise.each(items, function(item){
      debug('delete ', item.provider , ' provider: ', item.id);
      return _this.delete({id: item.id, provider: item.provider});
    });
  }).catch(function(err){
    debug('err', err.stack);
    throw err;
  });
});


ProviderSchema.statics.getUserProviders = Promise.method(function(userId){
  var _this = this;
  debug('getUserProviders: userId:', userId);

  if(_.isUndefined(userId)) return null;

  // update the account
  return _this.query('userId').eq(userId).attributes(['id', 'provider', 'data']).exec()
    .then(function(items){
      return _.forEach(items, function(item) {
        switch (item.provider){
         case 'twitter':
            item.screen_name = item.data.screen_name;
            break;
         case 'facebook':
            break;
         case 'instagram':
            console.log('data', item);
            item.username = item.data ? item.data.username : '';
            break;
         case 'google':
            item.account = 'todo';
            break;
         case 'password':
            item.id = 'yeah we dont show the email';
            break;
        }
        delete item.data;
      });
    })
    .catch(function(err){
      console.log('err: ', err.stack);
      throw err;
    });
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
    .then(function(res, params){
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
