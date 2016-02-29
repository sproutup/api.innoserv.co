'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
/* global -Promise */
var Promise = require('bluebird');
var moment = require('moment');
var redis = require('config/lib/redis');
var Channel = dynamoose.model('Channel');
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
  var _channel;
  Channel.createNewChannel(req.user.id, req.params.campaignId, 'Campaign').then(function(ch){
    // Get company ID so we can call addCompanyUsers
    _channel = ch;
    return Campaign.get(req.params.campaignId);
  }).then(function(campaign) {
    // Add company members to the message channel
    return Channel.addCompanyMembers(campaign.companyId, _channel.id);
  }).then(function() {
    res.json(_channel);
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
  Channel
    .query('userId').eq(req.user.id)
    .exec().then(function(item){
    res.json(item);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

exports.findByRefId = function (req, res) {
  var _userId = req.user.id;
  if(req.body.userId){
    console.log('found user id:', req.body.userId);
    _userId = req.body.userId;
  }

  Channel
    .queryOne('refId').eq(req.params.refId)
    .where('userId').eq(_userId)
    .exec().then(function(item){
      console.log('found channel: ', item);
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

  Channel.get(id).then(function(item){
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'Channel not found'
      });
    }

    req.model = item;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};
