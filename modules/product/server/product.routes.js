'use strict';

/**
 * Module dependencies.
 */
var policy = require('./product.policy'),
  ctrl = require('./product.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/product').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // Single routes
  app.route('/api/product/:productId').all(policy.isAllowed)
    .get(ctrl.read)
    .put(ctrl.update)
    .delete(ctrl.delete);

  // Single routes
  app.route('/api/company/:companyId/product').all(policy.isAllowed)
    .get(ctrl.listByCompany);


  // Finish by binding the middleware
  app.param('productId', ctrl.findByID);
};
