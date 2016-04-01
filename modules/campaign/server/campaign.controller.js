'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var Campaign = dynamoose.model('Campaign');
/* global -Promise */
var Promise = require('bluebird');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');
var config = require('config/config');

/* const variables */
var _isTemplate = -10;

exports.dropTable = function (req, res) {
  Campaign.$__.table.delete(function (err) {
    if(err) {
      console.log(err);
    }
    delete dynamoose.models.Campaign;
    res.json({result: 'campaign deleted'});
  });
};

/**
 * Show
 */
exports.read = function (req, res) {
  Promise.join(req.model.populate('Product'), req.model.populate('Company'))
    .then(function(){
      req.model.url = config.domains.mvp + 'campaign/' + req.model.id + '/' + req.model.type;
      res.json(req.model);
    })
    .catch(function(err){
      res.json({err: err});
    });
};

/**
 * Create
 */
exports.create = function (req, res) {
  var item = new Campaign(req.body);

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

/**
 * Create Template
 */
exports.createTemplate = function (req, res) {
  var item = new Campaign(req.body);

  item.status = _isTemplate;

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


/**
 * Update
 */
exports.update = function (req, res) {
  var obj = _.omit(req.body, ['id']);
  obj.updated = new Date();

  Campaign.update({ id: req.model.id }, obj, function (error, campaign) {
    if (error) {
      console.log('error:', error);
      return res.status(400).send({
        message: error
      });
    } else {
      res.json(campaign);
    }
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
  Campaign.queryActive().then(function(campaigns){
    res.json(campaigns);
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
  Campaign.query('companyId').eq(req.model.id).where('status').gt(-2).exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * List by product
 */
exports.listByProduct = function (req, res) {
  Campaign.query('productId').eq(req.model.id).exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    console.log('error: ' + err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * List only templates
 */
exports.listTemplate = function (req, res) {
  Campaign.query({status: _isTemplate}).exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    console.log(err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};


/**
 * middleware
 */
exports.campaignByID = function (req, res, next, id) {
  if (!_.isString(id)) {
    return res.status(400).send({
      message: 'Campaign is invalid'
    });
  }

  Campaign.getCached(id).then(function(item){
    console.log(item);
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'Campaign not found'
      });
    }

    req.model = item;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};
