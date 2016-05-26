'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var Team = dynamoose.model('Team');
var User = dynamoose.model('User');
var Company = dynamoose.model('Company');
var redis = require('config/lib/redis');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');
 /* global -Promise */
var Promise = require('bluebird');

/**
 * Show
 */
exports.read = function (req, res) {
  Team.get({userId: req.params.userId, companyId: req.params.companyId}).then(function(item){
    console.log(item);
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'Team not found'
      });
    }
    res.json(item);
  })
  .catch(function(err){
    return res.json(err);
  });
};

/**
 * Create
 */
exports.create = function (req, res) {
  var item = new Team(req.body);

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
  var item = req.model;

  //For security purposes only merge these parameters
  item.name = req.body.name;

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
 * Delete by user
 */
exports.delete = function (req, res) {
  var item = req.model;

  Team.delete({userId: req.params.userId, companyId: req.params.companyId}).then(function(result){
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
 * Delete by company
 */
exports.deleteByUser = function (req, res) {
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
  Team.scan().exec().then(function(items){
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
  Team.query({companyId: req.model.id}).exec().then(function(items){
    return Promise.map(items, function(item) {
      return item.populate('User')
        .then(function() {
          return item;
        });
    });
  })
  .then(function(items){
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
 * List by user
 */
exports.listByUser = function (req, res) {
  if (req.user && req.user.roles.indexOf('admin') > -1) {
    Company.scan().exec().then(function(companies){
      res.json(companies);
    })
    .catch(function(err){
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
  } else {
    Team.query({userId: req.user.id}).exec().then(function(items){
      if(items.length === 0) return [];
      var query = _.map(items, function(val){ return {id: val.companyId}; });
      return Company.batchGet(query);
    }).then(function(items){
      res.json(items);
    })
    .catch(function(err){
      return res.status(400).send({
        message: err
      });
    });
  }
};

/**
 * List by user with invitiations
 */
exports.listAllByUser = function (req, res) {
  var _companies;

  if (req.user && req.user.roles.indexOf('admin') > -1) {
    Company.scan().exec().then(function(companies){
      res.json(companies);
    })
    .catch(function(err){
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
  } else {
    Team.query({userId: req.user.id}).exec().then(function(items){
      if(items.length === 0) return [];
      var query = _.map(items, function(val){ return {id: val.companyId}; });
      return Company.batchGet(query);
    }).then(function(items){
      _companies = items;
      return redis.keys('invite:' + req.user.email + '*').map(function(item) {
        return redis.hmget(item, ['companyId']);
      });
    }).then(function(ids) {
      return Promise.map(ids, function(id) {
        return Company.getCached(id);
      });
    }).then(function(invitations){
      res.json({
        companies: _companies,
        invitations: invitations
      });
    }).catch(function(err){
      return res.status(400).send({
        message: err
      });
    });
  }
};

/**
 * Leave
 */
exports.leave = function (req, res) {
  if (!req.user || !req.user.id || !req.body.companyId) {
    console.log('error removing team member—missing parameters:', error);
    return res.status(400).send({
      message: 'Missing parameters.'
    });
  }

  Team.removeMember(req.user.id, req.body.companyId).then(function() {
    return res.status(200).send({
      message: 'Left team.'
    });
  }).catch(function(error) {
    console.log('error removing team member', error);
    return res.status(400).send({
      message: 'Something went wrong.'
    });
  })
};

/**
 * middleware
 */
exports.findByID = function (req, res, next, id) {
  if (!_.isString(id)) {
    return res.status(400).send({
      message: 'Product is invalid'
    });
  }

  Team.get(id).then(function(item){
    console.log(item);
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'Team not found'
      });
    }

    req.model = item;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};
