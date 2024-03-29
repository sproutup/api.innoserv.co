'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  _ = require('lodash'),
  dynamoose = require('dynamoose'),
  User = dynamoose.model('User'),
  cache = require('config/lib/cache'),
  errorHandler = require(path.resolve('./modules/core/server/errors.controller'));

/**
 * Show the current user
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Update a User
 */
exports.update = function (req, res) {
  var user = req.model;

  //For security purposes only merge these parameters
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.displayName = user.firstName + ' ' + user.lastName;
  user.roles = req.body.roles;

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * clear cache
 */
exports.clear = function (req, res) {
  var user = req.model;
  var key = 'user:' + user.id;
  var metric_key = 'service:metric:' + user.id;

  cache.del(key, function() {
    cache.del(metric_key, function() {
      res.json({result: 'ok', key: key});
    });
  });
};


/**
 * upgrade user to admin
 */
exports.upgrade = function (req, res) {
  var user = req.model;
  var key = 'user:' + user.id;

  user.roles = ['user', 'admin'];
  user.save().then(function() {
    res.json({result: 'ok'});
  });
};


/**
 * Delete a user
 */
exports.delete = function (req, res) {
  var user = req.model;

  user.remove(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * List of Users
 */
exports.list = function (req, res) {
  User.scan().exec(function (err, users) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(users);
  });
};

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  if (!_.isString(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.get(id).then(function(user) {
    req.model = user;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};
