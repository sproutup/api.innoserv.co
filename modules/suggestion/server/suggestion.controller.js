'use strict';

/**
 * Module dependencies.
 */
var config = require('config/config');
var dynamoose = require('dynamoose');
var Suggestion = dynamoose.model('Suggestion');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');
  /* global -Promise */
var Promise = require('bluebird');

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
  var item = new Suggestion(req.body);

  if (!_.isString(req.body.url)) {
    return res.status(400).send({
      message: 'Missing requiered param: url'
    });
  }
  if (!_.isString(req.body.name)) {
    return res.status(400).send({
      message: 'Missing requiered param: name'
    });
  }

  if(req.user){
    item.userId = req.user.id;
  }

  item.save().then(function(val) {
    res.json(item);
  })
  .catch(function(err){
    res.status(400).send({
        message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Update
 */
exports.update = function (req, res) {
  var item = req.model;

  //For security purposes only merge these parameters
  _.extend(item, _.pick(req.body, ['title']));

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
  Suggestion.scan().exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};


/**
 * List by user
 */
exports.listByUser = function (req, res) {
  Suggestion.query('userId').eq(req.params.userId).exec().then(function(items){
    return items;
  })
  .then(function(items){
    res.json(items);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * middleware
 */
exports.findByID = function (req, res, next, id) {
  if (!_.isString(id)) {
    return res.status(400).send({
      message: 'Suggestion is invalid'
    });
  }

  Suggestion.get(id).then(function(item){
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'Suggestion not found'
      });
    }

    req.model = item;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};

