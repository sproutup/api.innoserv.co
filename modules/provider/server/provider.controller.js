'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
/* global -Promise */
var Promise = require('bluebird');
var moment = require('moment');
var redis = require('config/lib/redis');
var Provider = dynamoose.model('Provider');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');

/**
 * List
 */
exports.list = function (req, res) {
  Provider.scan().exec().then(function(items){
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
exports.listByUser = function (req, res) {
  Provider.query('userId').eq(req.params.userId).exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};
