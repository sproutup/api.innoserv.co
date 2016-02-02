'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var Company = dynamoose.model('Company');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');

/**
 * Show the company
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Create
 */
exports.create = function (req, res) {
  var company = new Company(req.body);

  company.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(company);
    }
  });
};

/**
 * Update
 */
exports.update = function (req, res) {
  var company = req.model;

  //For security purposes only merge these parameters
  company.name = req.body.name;
  company.url = req.body.url;
  company.address = req.body.address;
  company.phone = req.body.phone;

  company.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(company);
  });
};

/**
 * Delete a company
 */
exports.delete = function (req, res) {
  var company = req.model;

  company.delete().then(function(result){
    res.json(company);
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
 * List of Companies
 */
exports.list = function (req, res) {
  Company.scan().exec().then(function(companies){
    res.json(companies);
  })
  .catch(function(err){
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
  });
};

/**
 * Company middleware
 */
exports.companyByID = function (req, res, next, id) {
  if (!_.isString(id)) {
    return res.status(400).send({
      message: 'Company is invalid'
    });
  }

  Company.find(id).then(function(company){
    if(_.isUndefined(company)){
      return res.status(400).send({
        message: 'Company not found'
      });
    }

    req.model = company;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};

exports.companyBySlug = function (req, res, next, slug) {
  if (!_.isString(slug)) {
    return res.status(400).send({
      message: 'Company is invalid'
    });
  }

  Company.findBySlug(slug).then(function(company){
    if(_.isUndefined(company)){
      return res.status(400).send({
        message: 'Company not found'
      });
    }

    req.model = company;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};
