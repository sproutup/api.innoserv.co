'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
//  Product = require('./products.model'),
  rp = require('request-promise'),
  errorHandler = require('modules/core/server/errors.controller');

var options = {
    method: 'GET',
    uri: 'http://localhost:3100/api/product',
    body: {},
    json: true // Automatically stringifies the body to JSON
};

/**
 * Create a product
 */
exports.create = function (req, res) {
  options.method = 'POST';
  options.body = req.body;

  rp(options)
    .then(function (body) {
      // POST succeeded...
      res.json(body);
    })
    .catch(function (err) {
      // POST failed...
      res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};

/**
 * Show the current product
 */
exports.read = function (req, res) {
  res.json(req.product);
};

/**
 * Update a article
 */
exports.update = function (req, res) {
  options.method = 'UPDATE';
  options.body = req.body;

  rp(options)
    .then(function (body) {
      // POST succeeded...
      res.json(body);
    })
    .catch(function (err) {
      // POST failed...
      res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};

/**
 * Delete an article
 */
exports.delete = function (req, res) {
  options.method = 'DELETE';
  options.body = req.body;

  rp(options)
    .then(function (body) {
      // POST succeeded...
      res.json(body);
    })
    .catch(function (err) {
      // POST failed...
      res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};

/**
 * List of products
 */
exports.list = function (req, res) {
  options.method = 'GET';

  rp(options)
    .then(function (body) {
      // POST succeeded...
      res.json(body);
    })
    .catch(function (err) {
      // POST failed...
      res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};

/**
 * middleware
 */
exports.productByID = function (req, res, next, id) {

  if (!_.isFinite(parseInt(id, 10))) {
    return res.status(400).send({
      message: 'Product id is invalid'
    });
  }

  options.uri = options.uri + '/' + id;
  next();
};
