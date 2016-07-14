'use strict';

/**
 * Module dependencies.
 */
var policy = require('./metric.policy'),
  ctrl = require('./metric.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/metric').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  app.route('/api/metric/query').all(policy.isAllowed)
    .post(ctrl.query);

  // Single routes
  app.route('/api/metric/:metricId').all(policy.isAllowed)
    .get(ctrl.read)
    .put(ctrl.update)
    .delete(ctrl.delete);

  // Finish by binding the middleware
  app.param('metricId', ctrl.findByID);
};
