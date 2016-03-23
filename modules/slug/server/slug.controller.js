'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var Slug = dynamoose.model('Slug');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');

/**
 * Show
 */
exports.read = function (req, res) {
  var item = req.model;
  console.log('populate: ', item.refType);
  var model = dynamoose.model(item.refType);
  model.getCached(item.refId).then(function(ref){
    if(_.isUndefined(ref)) return res.json(item);
    return res.json(ref);
  });
};

/**
 * Create
 */
exports.create = function (req, res) {

  Slug.createWrapper(req.body).then(function(item){
    res.json(item);
  }).catch(function(err){
    if(err.code === 'ConditionalCheckFailedException'){
      err = 'Duplicate entry for slug ' + req.body.id;
    }
    return res.status(400).send({
      message: err
    });
  });
};

/**
 * Checks if the slug id is available
 * @param id
 */
exports.check = function (req, res) {
  Slug.check(req.body.id).then(function(item){
    var result = {
      ok: true,
      error: ''
    };

    if(item===false){
      result.ok = false;
      result.error = 'taken';
    }

    res.json(result);
  });
};


/**
 * Update
 */
exports.update = function (req, res) {
  var item = req.model;

  //For security purposes only merge these parameters
  item.name = req.body.name;
  item.bucket = req.body.bucket;
  item.type = req.body.type;
  item.length = req.body.length;

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
  Slug.scan().exec().then(function(items){
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
exports.listByRef = function (req, res) {
  Slug.query({refId: req.params.refId}).exec().then(function(items){
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
      message: 'Slug is invalid'
    });
  }

  Slug.getCached(id).then(function(item){
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'slug not found'
      });
    }

    req.model = item;
    next();
  })
  .catch(function(err){
    console.log(err);
    return next(err);
  });
};

