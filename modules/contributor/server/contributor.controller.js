'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var debug = require('debug')('up:debug:contributor:ctrl');
var Contributor = dynamoose.model('Contributor');
var Content = dynamoose.model('Content');
var config = require('config/config');
var knex = require('config/lib/bookshelf').knex;
/* global -Promise */
var Promise = require('bluebird');
var Company = dynamoose.model('Company');
var Campaign = dynamoose.model('Campaign');
var Channel = dynamoose.model('Channel');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');
var sendgridService = require('modules/sendgrid/server/sendgrid.service');

/**
 * Show
 */
exports.read = function (req, res) {
  var _item;
  Contributor.queryOne('campaignId').eq(req.params.campaignId).where('userId').eq(req.params.userId).attributes(['address', 'bid', 'campaignId', 'comment', 'created', 'id', 'phone', 'state', 'userId', 'trial']).exec().then(function(item){
    debug('found contributor: ' + item.id);
    if(_.isUndefined(item)){
      return res.status(204).send({
        message: 'Contributor not found'
      });
    }
    _item = item;
  })
  .then(function(){
    return _item.populate('User');
  })
  .then(function(){
    return Content.query('campaignId').eq(req.params.campaignId).where('userId').eq(req.params.userId).exec().then(function(items){
      _item.content = items;
      return;
    }).catch(function(err){
      console.log('contributor err: ', err);
      return;
    });
  })
  .then(function(){
    return res.json(_item);
  })
  .catch(function(err){
    console.log('contributor err: ', err);
    return res.json(err);
  });
};

/**
 * Create
 */
exports.create = function (req, res) {
  var item = new Contributor(req.body);

  item.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(item);
    }
  });
};

/**
 * Update
 */
exports.update = function (req, res) {
  var _item;
  var _previousState;
  var _previousRecommended;
  Contributor.queryOne('campaignId').eq(req.params.campaignId).where('userId').eq(req.params.userId).attributes(['address', 'bid', 'campaignId', 'comment', 'created', 'id', 'phone', 'state', 'userId', 'trial']).exec()
    .then(function(item){
      if(_.isUndefined(item)){
        return res.status(400).send({
          message: 'Contributor not found'
        });
      }
      return item;
  })
  .then(function(item){
    _previousState = item.state;
    _previousRecommended = item.recommended;
    _item = item;
    //For security purposes only merge these parameters
    // _.extend(item, _.pick(req.body, ['state','link','address','phone','comment','bid', 'trial.shippingState']));
    _.extend(item, req.body);
    return item.save();
  })
  .then(function(data){
    // Send an email if a contributor has been approved
    if ((_previousState === 0) && (_item.state === 1 || _item.state === '1')) {
      sendApprovedEmail(_item);
    }

    // Send an email if we've just recommended someone
    if (!_previousRecommended && _item.recommended) {
      sendRecommendedEmails(_item);
    }

    return data;
  })
  .then(function(data){
    res.json(_item);
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
  Contributor.queryOne({campaignId: req.params.campaignId, userId: req.params.userId}).exec().then(function (item) {
    item.delete().then(function(){
      res.json(item);
    });
  })
  .catch(function (err) {
    console.log('err: ', err);
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
  Contributor.scan().exec().then(function(items){
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
  Contributor.query({campaignId: req.model.id})
    .exec().then(function(items){
      return Promise.map(items, function(val){
        return val.populate('User');
      })
      .catch(function(err){
        console.log('err: ', err);
        throw err;
      });
    })
  .then(function(items){
    res.json({
      status: 'ok',
      campaign: req.model,
      items: items
    });
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
  var contributions = null;
  var campaigns = null;
  Contributor.query({userId: req.params.userId}).attributes(['address', 'bid', 'campaignId', 'comment', 'created', 'id', 'phone', 'state', 'userId', 'trial']).exec().then(function(items){
    contributions = items;
    if(items.length > 0){
      return Promise.map(contributions, function(item){
         return item.populate('Campaign')
          .then(function(res) {
            return res;
          });
      });
    }
    else{
      return [];
    }
  })
  .then(function(_items){
    res.json(_items);
  })
  .catch(function(err){
    console.log('err: ', err);
    return res.status(400).send({
      message: err
    });
  });
};


/**
 * middleware
 */
exports.findByID = function (req, res, next, id) {
  if (!_.isString(id)) {
    return res.status(400).send({
      message: 'Contributor is invalid'
    });
  }

  Contributor.get(id).then(function(item){
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'Contributor not found'
      });
    }

    req.model = item;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};

var sendApprovedEmail = function(data) {
  var _campaign;

  return Campaign.get(data.campaignId).then(function(campaign) {
    _campaign = campaign;
    return Company.get(campaign.companyId);
  })
  .then(function(company) {
    var url = config.domains.mvp + _campaign.type + 's/' + _campaign.id;
    var substitutions = {
      ':campaign_name': [_campaign.name],
      ':campaign_url': [url],
      ':brand_name': [company.name],
      ':shipping_address': [data.address],
      ':phone_number': [data.phone]
    };

    sendgridService.sendToUser(data.userId, 'Hooray! Your request has been approved!', substitutions, config.sendgrid.templates.approved);
  })
  .catch(function(error) {
    console.log('approved email error: ', error);
  });
};

// sendRecommendedEmails sends out two sets of emails
// One to the company, letting them know we've recommended someone
// And another to the user to let them know that they were recommended
var sendRecommendedEmails = function(data) {
  var _campaign;

  return Campaign.get(data.campaignId).then(function(campaign) {
    _campaign = campaign;
    return Company.get(campaign.companyId);
  })
  .then(function(company) {
    var url = config.domains.creator + company.slug + '/campaign/' + _campaign.id + '/view/' + _campaign.type + '/requests/contributor/' + data.userId;
    var substitutions = {
      ':campaign_name': [_campaign.name],
      ':contributor_name': [data.user.displayName],
      ':contributor_note': [data.note],
      ':contributor_url': [url],
      ':brand_name': [company.name]
    };

    sendgridService.sendToCompanyUsers(company.id, 'We recommended you ' + data.user.displayName + ' for ' + _campaign.name, substitutions, config.sendgrid.templates.recommend2brand);
    sendgridService.sendToUser(data.user.id, 'Congrats! SproutUp recommended you to ' + company.name +  ' for ' + _campaign.name, substitutions, config.sendgrid.templates.recommended);
  })
  .catch(function(error) {
    console.log('recommended email error: ', error);
  });
};
