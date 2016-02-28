'use strict';

/**
 * Module dependencies.
 */
var config = require('config/config');
var dynamoose = require('dynamoose');
/* global -Promise */
var Promise = require('bluebird');
var moment = require('moment');
var redis = require('config/lib/redis');
var Message = dynamoose.model('Message');
var Member = dynamoose.model('Member');
var Channel = dynamoose.model('Channel');
var User = dynamoose.model('User');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');
var sendMessageEmail = sendMessageEmail;
var sendgridService = Promise.promisifyAll(require('modules/sendgrid/server/sendgrid.service'));
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
  var item = new Message(req.body);

  item.userId = req.user.id;

  item.save().then(function() {
    sendMessageEmail(item);
    item.created = moment(item.created).toISOString();
    res.json(item);
  })
  .catch(function(err) {
    return res.status(400).send({
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
  Message.scan().exec().then(function(items){
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
exports.listByChannel = function (req, res) {
  Message.query('channelId').eq(req.params.channelId).exec().then(function(items){
    return Promise.map(items, function(val){
      return val.populate('User');
    })
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
      message: 'Message is invalid'
    });
  }

  Message.get(id).then(function(item){
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'Message not found'
      });
    }

    req.model = item;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};

var sendMessageEmail = function(message) {
  var _members;

  // Get channel members
  Member.query('channelId').eq(message.channelId).exec().then(function(items){
    _members = items;
    return User.get(message.userId);
  })
  .then(function(user) {
    // Remove user who sent the message
    var members = _members.filter(function(item) {
      return item.userId !== message.userId;
    });
    var subject = 'New message from ' + user.displayName;
    var substitutions = {
      ':sender': [user.displayName],
      ':message_body': [message.body]
    };

    for (var i = 0; i < members.length; i++) {
      if (members[i].isCreator) {
        substitutions[':url'] = [config.domains.creator + 'messages/' + message.channelId];
      } else {
        substitutions[':url'] = [config.domains.mvp + 'messages/' + message.channelId];
      }
      sendgridService.sendToUser(members[i].userId, subject, substitutions, config.sendgrid.templates.message);
    }
  });
};
