'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var Team = dynamoose.model('Team');
var User = dynamoose.model('User');
var Company = dynamoose.model('Company');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');

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
    var query = _.map(items, function(val){ return {id: val.userId}; });
    return User.batchGet(query);
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
  Team.query({userId: req.model.id}).exec().then(function(items){
    var query = _.map(items, function(val){ return {id: val.companyId}; });
    return Company.batchGet(query);
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
