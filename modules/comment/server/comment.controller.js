'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var CommentModel = dynamoose.model('Comment');
var User = dynamoose.model('User');
/* global -Promise */
var Promise = require('bluebird');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');
var moment = require('moment');

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
  var item = new CommentModel(req.body);

  if (!_.isString(req.params.refId) && !_.isString(req.params.refType)) {
    return res.status(400).send({
      message: 'Missing params'
    });
  }

  item.userId = req.user.id;
  item.refId = req.params.refId;
  item.refType = req.params.refType;

  item.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      item.populate('User')
        .then(function() {
          item.created = moment(item.created);
          res.json(item);
        });
    }
  });
};

/**
 * Update
 */
exports.update = function (req, res) {
  var item = req.model;

  //For security purposes only merge these parameters
  _.extend(item, _.pick(req.body, ['body']));

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
  CommentModel.scan().exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * List by ref
 */
exports.listByRef = function (req, res) {
  CommentModel
    .query('refId').eq(req.params.refId)
    .exec().then(function(items){
      return Promise.map(items, function(item) {
        return item.populate('User')
          .then(function() {
            return item;
          });
      });
    })
    .then(function(items) {
      res.json(items);
    })
    .catch(function(err){
      console.log('err: ', err);
      return res.status(400).send({
        message: err.message
      });
    });
};

/**
 * middleware
 */
exports.findByID = function (req, res, next, id) {
  if (!_.isString(id)) {
    return res.status(400).send({
      message: 'Comment is invalid'
    });
  }

  CommentModel.get(id).then(function(item){
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'Comment not found'
      });
    }

    req.model = item;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};
