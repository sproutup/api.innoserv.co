'use strict';

/**
 * Module dependencies.
 */
var policy = require('./service.policy'),
  ctrl = require('./service.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/service').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // Single routes
  app.route('/api/service/:serviceId').all(policy.isAllowed)
    .get(ctrl.read)
    .put(ctrl.update)
    .delete(ctrl.delete);

  // collection routes
  app.route('/api/user/:userId/service/metrics')//.all(policy.isAllowed)
    .get(ctrl.fetchUserServiceMetrics);

  // Finish by binding the middleware
  app.param('serviceId', ctrl.findByID);
};
