'use strict';

/**
 * Module dependencies.
 */
var path = require('path');
var config = require('config/config');
var dynamoose = require('config/lib/dynamoose');
var Promise = require('bluebird');
var _ = require('lodash');
var Network = dynamoose.model('Network');
//var OAuth = require('oauth');
var oauth = require('modules/oauth/server/oauth.service');
var instagram = require('modules/instagram/server/instagram.service');
var facebook = require('modules/facebook/server/facebook.service');
var twitter = require('modules/core/server/twitter.service');

//Promise.promisifyAll(OAuth);

/**
 * List all network
 */
exports.listAll = function (req, res) {
  console.log('user reach controller');

  Network.scan().exec().then(function(items) {
    console.log('user network result', items);
    res.json(items);
  })
  .catch(function(err){
    res.json(err);
  });
};

/**
 * List users network
 */
exports.list = function (req, res) {
  console.log('[network] list ctrl');
  res.json(req.network);
};

/**
 * Create a network
 */
exports.create = function (req, res) {
  if (_.isUndefined(req.body.verifier)) {
    return res.status(400).send({
      message: 'Verifier is missing'
    });
  }

  req.network.verifier = req.body.verifier;
  Network.update(
      {userId: req.network.userId, provider: req.network.provider},
      {$PUT: {verifier: req.body.verifier, status: 1}})
    .then(function(){
      console.log('[network] get access token: ', req.network.token);
      return oauth.getAccessToken(
          req.network.token,
          req.network.provider,
          req.network.tokenSecret,
          req.body.verifier);
    })
    .then(function(access){
      console.log('[network] save access token: ', access);
      return Network.update(
        {userId: req.network.userId, provider: req.network.provider},
        {$PUT: { accessToken: access.accessToken,
                 accessSecret: access.accessSecret,
                 refreshToken: access.refreshToken,
                 identifier: access.identifier,
                 handle: access.handle,
                 status: 1}});
    })
    .then(function(){
      console.log('[network] done');
      res.json(req.network);
    })
    .catch(function(err){
       return res.status(400).send({
        message: err
      });
    });
};

/*
 * Show the users network
 */
exports.read = function (req, res) {
  Network.query('userId').eq(req.params.userId)
    .where('provider').eq(req.params.provider)
    .exec()
    .then(function(result){
      console.log('get network: ', result.length);
      if(result.length === 0){
        req.network = {};
      }
      else{
        req.network = result[0];
      }
      res.json(req.network);
    });
};

/*
 * update access token
 */
exports.update = function (req, res) {
  Network.query('userId').eq(req.params.userId)
    .where('provider').eq(req.params.provider)
    .exec()
    .then(function(result){
      console.log('[network] update get network: ', result);
      if(result.length === 0){
        req.network = {};
      }
      else{
        console.log(result[0].verifier);
        console.log(result[0].provider);
        oauth.getAccessToken(result[0].token, result[0].provider,
            result[0].tokenSecret, result[0].verifier)
          .then(function(access){
            console.log('[network] access token: ', access);
            return Network.update(
              {userId: result[0].userId, provider: result[0].provider},
              {$PUT: {
                       accessToken: access.accessToken,
                       accessSecret: access.accessSecret,
                       refreshToken: access.refreshToken,
                       identifier: access.identifier,
                       handle: access.handle,
                       status: 1}});
          })
          .then(function(data){
            console.log(data);
            res.json('[network] update success');
          })
          .catch(function(err){
            Network.update(
              {userId: result[0].userId, provider: result[0].provider},
              {$PUT: {status: -1}}).then(function(result){
                res.json('[network] update error');
            });
          });
      }
    });
};


/**
 * Delete
 */
exports.delete = function (req, res) {
  var item = req.network;

  Network.delete({userId: req.userId, provider: req.provider}).then(function(data){
    res.json(data);
  })
  .catch(function(err){
    console.log('err:',err);
    return res.status(400).send({
      message: err
    });
  });
};


/*
 * Get connection url
 */
exports.connect = function (req, res) {
  console.log('[network] connect', req.config);
  var url = '';

  oauth.generateAuthURL(req.provider)
    .then(function(item){
      console.log('[network] auth url', item);
      url = item.url;
      var network = new Network();
      network.provider = req.provider;
      network.userId = req.userId;
      network.token = item.token;
      network.tokenSecret = item.tokenSecret;
      network.status = 0;
      return network.save();
    })
    .then(function(item){
      res.json({error: '', url: url});
    })
    .catch(function(err){
      console.log('[network] err:', err);
      res.json({error: err});
    });
};

/*
 * Show stats
 */
exports.readStats = function (req, res) {
 Network.query('userId').eq(req.params.userId)
    .where('provider').eq(req.params.provider).exec()
    .then(function(result){
      console.log('get network: ', result.length);
      if(result.length === 0){
        req.network = {};
      }
      else{
        var network = result[0];
        switch(req.provider){
          case 'tw':
            twitter.verifyCredentials(network.accessToken, network.accessSecret).then(function(response){
              console.log('show user: ', response);
              return res.json(response);
            });
            break;
          case 'fb':
            facebook.showUser('me', network.accessToken).then(function(response){
              console.log('show user: ', response);
              return res.json(response);
            });
            break;
          case 'ig':
            instagram.showUser('self', network.accessToken).then(function(response){
              console.log('show user: ', response);
              return res.json(response);
            });
            break;
          default:
            res.json('todo');
        }
      }
    });
};


/**
 * Middleware
 */
exports.networkByUserID = function (req, res, next, id) {
  console.log('middleware');
  if (_.isUndefined(id)) {
    return res.status(400).send({
      message: 'User ID is invalid'
    });
  }
  Network.query('userId').eq(id).exec().then(function(result){
    console.log('get network: ', result.length);
    if(result.length === 0){
      req.network = [];
    }
    else{
      req.network = result;
    }
    req.userId = id;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};

/**
 * Middleware
 */
exports.networkByToken= function (req, res, next, token) {
  console.log('middleware token');
  if (_.isUndefined(token)) {
    return res.status(400).send({
      message: 'Token is invalid'
    });
  }
  Network.query('token').eq(token).exec().then(function(result){
    console.log('get network: ', result);
    if(result.length === 0){
      return res.status(400).send({
        message: 'Token not found'
      });
    }
    req.network = result[0];
    req.token = token;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};

/**
 * Middleware
 */
exports.networkByProvider = function (req, res, next, provider) {
  console.log('middleware');
  if (_.isUndefined(provider)) {
    return res.status(400).send({
      message: 'Provider is invalid'
    });
  }
  req.provider = provider;
  next();
};
