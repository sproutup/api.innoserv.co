'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
/* global -Promise */
var Promise = require('bluebird');
var moment = require('moment');
var cache = require('config/lib/cache');
var Channel = dynamoose.model('Channel');
var Member = dynamoose.model('Member');
var Campaign = dynamoose.model('Campaign');
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
  var item = new Channel(req.body);

  item.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(item);
    }
  });
};

exports.createCampaignChannel = function (req, res) {
  var _userId;
  var _channel;

  if (req.body.userId) {
    _userId = req.body.userId;
  } else {
    _userId = req.user.id;
  }

  Channel.createCampaignChannel(_userId, req.params.campaignId).then(function(ch){
    // Get company ID so we can call addCompanyUsers
    res.json(ch);
  }).catch(function(err) {
    return res.status(400).send(err);
  });
};

/**
 * Update
 */
exports.update = function (req, res) {
  var item = req.model;

  //For security purposes only merge these parameters
  item.body = req.body.body;

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
  Channel.scan().exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * listByUser
 */
exports.listByUser = function (req, res) {
  console.log('list by user');
  var channels = [];
  var items;
//  Channel.query('userId').eq(req.user.id).exec().then(function(result){
  Channel.queryByUser(req.user.id).then(function(result){
    items = result;
    console.log('items: ', items);
    for (var i = 0; i < items.length; ++i) {
      console.log('push');
      channels.push(Channel.populateLatestMessage(items[i]));
    }
    return Promise.all(channels);
//    return items;
  }).then(function(val){
    console.log('all done');
    res.json(items);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

exports.findByRefId = function (req, res) {
  Channel.get(req.params.id).then(function(item){
    res.json(item);
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
      message: 'Channel is invalid'
    });
  }
  Channel.getCached(id).then(function(item){
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'Channel not found'
      });
    }
    req.model = item;
    next();
  })
  .catch(function(err){
    console.log('err: ', err);
    return next(err);
  });
};
