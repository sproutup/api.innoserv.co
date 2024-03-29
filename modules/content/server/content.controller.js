'use strict';

/**
 * Module dependencies.
 */
var config = require('config/config');
var dynamoose = require('dynamoose');
var Content = dynamoose.model('Content');
var Metric = dynamoose.model('Metric');
var Campaign = dynamoose.model('Campaign');
var Contributor = dynamoose.model('Contributor');
var User = dynamoose.model('User');
var Company = dynamoose.model('Company');
var knex = require('config/lib/bookshelf').knex;
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');
var path = require('path');
var debug = require('debug')('up:debug:content:ctrl');
  /* global -Promise */
var Promise = require('bluebird');
var sendgridService = Promise.promisifyAll(require('modules/sendgrid/server/sendgrid.service'));

/**
 * Show
 */
exports.read = function (req, res) {
  res.json(req.model);
};

var sendContentEmail = function(content) {
  var _campaign,
      _company;

  return Campaign.get(content.campaignId).then(function(campaign) {
    _campaign = campaign;
    return Company.get(campaign.companyId);
  })
  .then(function(company) {
    _company = company;
    return User.getCached(content.userId);
  })
  .then(function(user) {
    var companyId = _campaign.companyId;
    var subject = 'New Content on your SproutUp Campaign!';
    var url = config.domains.creator + 'com/' + _company.slug + '/campaign/' + _campaign.type + '/' + _campaign.id + '/stats/' + content.id;
    var substitutions = {
      ':user_name': [user.displayName],
      ':content_title': [content.title],
      ':content_url': [url]
    };
    var template = '3ca10b9d-1f15-4bde-bd25-9cc84cb75a11';
    sendgridService.sendToCompanyUsers(companyId, subject, substitutions, template);
  })
  .catch(function(error) {
    console.log('error: ', error.stack);
    throw error;
  });
};

/**
 * Create
 */
exports.create = function (req, res) {
  var item = new Content(req.body);
  item.userId = req.user.id;
  item.timestamp = 0; // force metrics update
  debug('add content' + item.title);

  item.save().then(function(val) {
    debug('content id: ', val.id);
    sendContentEmail(item);
    Contributor.updateState(val.campaignId, val.userId, 2);
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
  _.extend(item, _.pick(req.body, ['title', 'timestamp']));

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
  Content.scan().exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};


/**
 * List by campaign
 */
exports.listByCampaign = function (req, res) {
  Content.query('campaignId').eq(req.params.campaignId).exec().then(function(items){
    return Promise.map(items, function(val){
      return val.populate('User').then(function(){
        return Metric.getYoutubeMetrics(val.ref).then(function(metrics){
          val.metrics = metrics;
          return val;
        });
      });
    });
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
 * List by company
 */
exports.listByCompany = function (req, res) {
  Campaign.query('companyId').eq(req.params.companyId).exec().then(function(items){
    return Promise.map(items, function(item){
      return Content.query('campaignId').eq(item.id).exec();
    });
  })
  .then(function(content){
    res.json(_.flatten(content));
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
      message: 'Content is invalid'
    });
  }

  Content.get(id).then(function(item){
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'Content not found'
      });
    }

    req.model = item;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};
