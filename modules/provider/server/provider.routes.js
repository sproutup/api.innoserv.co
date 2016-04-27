'use strict';

/**
 * Module dependencies.
 */
var policy = require('./provider.policy'),
  ctrl = require('./provider.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/provider').all(policy.isAllowed)
    .get(ctrl.list);

  // collection routes
  app.route('/api/user/:userId/provider').all(policy.isAllowed)
    .get(ctrl.listByUser);

  // collection routes
  app.route('/api/user/:userId/service')//.all(policy.isAllowed)
    .get(ctrl.listServicesByUser);

  app.route('/api/user/:userId/metrics')//.all(policy.isAllowed)
    .get(ctrl.listMetricsByUser);

};
