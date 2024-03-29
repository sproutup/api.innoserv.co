'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var debug = require('debug')('up:debug:post:ctrl');
var Promise = require('bluebird');
var moment = require('moment');
var redis = require('config/lib/redis');
var Post = dynamoose.model('Post');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');

/**
 * Show
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Create
 */
exports.create = function (req, res) {
  var item = new Post(req.body);
  debug('create: ', req.body);
  item.userId = req.user.id;
  item.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      //redis.set('Post:' + item.id, JSON.stringify(item));
      redis.zadd('post:timeline:all', moment(item.created).unix(), item.id);
      redis.zadd('post:timeline:user:'+item.userId, moment(item.created).unix(), item.id);
      if(item.groupId){
        redis.zadd('post:timeline:group:'+item.groupId, moment(item.created).unix(), item.id);
      }
      // add posting user to result
      item.user = req.user;
      res.json(item);
    }
  });
};

/**
 * Update
 */
exports.update = function (req, res) {
  var item = req.model;

  //For security purposes only merge these parameters
  //item.body = req.body.body;
  item.visibility = req.body.visibility;

  item.save().then(function(data){
    res.json(item);
  })
  .catch(function (err) {
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Delete
 */
exports.delete = function (req, res) {
  var item = req.model;

  item.delete().then(function(result){
    res.json(item);
  })
  .catch(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  });
};

/**
 * List
 */
exports.list = function (req, res) {
  Post.scan().exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * List
 */
exports.timeline = function (req, res) {
  var key = 'post:timeline:all';
  var index = 0;

  if(typeof req.params.index === 'string'){
    index = parseInt(req.params.index);
  }
  redis.exists(key).then(function(val){
    if(val===0){
      console.log('key not found: ', key);
      return Post.scan().exec().then(function(items){
        return Promise.map(items, function(item){
          redis.zadd(key, moment(item.created).unix(), item.id);
        });
      });
    }
    else{
      return val;
    }
  })
  .then(function(val){
    return redis.zrevrange(key, index, index+9).map(function(value){
      return Post.getCached(value);
    });
  })
  .then(function(val){
    res.json(val);
  })
  .catch(function(err){
    console.log('err', err);
    res.json({err: err});
  });
};

exports.timelineGroup = function (req, res) {
  var key = 'post:timeline:group';
  var index = 0;

  if(typeof req.params.index === 'string'){
    index = parseInt(req.params.index);
  }

  key = key + ':' + req.params.groupId;

  redis.exists(key).then(function(val){
    if(val===0){
      console.log('key not found: ', key);
      return Post.query('groupId').eq(req.params.groupId).exec().then(function(items){
        return Promise.map(items, function(item){
          redis.zadd(key, moment(item.created).unix(), item.id);
        });
      });
    }
    else{
      return val;
    }
  })
  .then(function(val){
    // #magic
    return redis.zrevrange(key, index, 9).map(function(value){
      return Post.getCached(value);
    });
  })
  .then(function(val){
    res.json(val);
  })
  .catch(function(err){
    console.log('err', err);
    res.json({err: err});
  });
};

exports.timelineUser = function (req, res) {
  var key = 'post:timeline:user';
  var index = 0;

  if(typeof req.params.index === 'string'){
    index = parseInt(req.params.index);
  }

  key = key + ':' + req.params.userId;

  redis.exists(key).then(function(val){
    if(val===0){
      console.log('key not found: ', key);
      return Post.query('userId').eq(req.params.userId).exec().then(function(items){
        return Promise.map(items, function(item){
          redis.zadd(key, moment(item.created).unix(), item.id);
        });
      });
    }
    else{
      return val;
    }
  })
  .then(function(val){
    // #magic
    return redis.zrevrange(key, index, 9).map(function(value){
      return Post.getCached(value);
    });
  })
  .then(function(val){
    res.json(val);
  })
  .catch(function(err){
    console.log('err', err);
    res.json({err: err});
  });
};

/**
 * middleware
 */
exports.findByID = function (req, res, next, id) {
  if (!_.isString(id)) {
    return res.status(400).send({
      message: 'Post is invalid'
    });
  }

  Post.getCached(id).then(function(item){
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'Post not found'
      });
    }

    req.model = item;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};
