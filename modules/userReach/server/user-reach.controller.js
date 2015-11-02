'use strict';

/**
 * Module dependencies.
 */
var path = require('path');
var dynamoose = require('config/lib/dynamoose');
var _ = require('lodash');
var UserReach = dynamoose.model('UserReach');

/**
 * List of Articles
 */
exports.list = function (req, res) {
  console.log('user reach controller');

  UserReach.scan().exec().then(function(res){
    console.log('scan: ', res);
  });

  UserReach.scan().exec().then(function(items) {
    console.log('user reach result', items);
    res.json(items);
  })
  .catch(function(err){
    res.json(err);
  });
};

/*
 * Show the current reach
 */
exports.read = function (req, res) {
  console.log('read');
  var total = _.sum(req.userReach) - req.userReach.userId;
  req.userReach.total = total;
  res.json(req.userReach);
};

/**
 * Middleware
 */
exports.userReachByID = function (req, res, next, id) {
  console.log('middleware');
  if (_.isUndefined(id)) {
    return res.status(400).send({
      message: 'User ID is invalid'
    });
  }
  UserReach.query('userId').eq(id).exec().then(function(userReach){
    console.log('get reach: ', userReach.length);
    if(userReach.length === 0){
      req.userReach = {'total': 0};
    }
    else{
      req.userReach = userReach[0];
    }
    next();
  })
  .catch(function(err){
    return next(err);
  });
};
