'use strict';

/**
 * Module dependencies.
 */
var policy = require('./slug.policy'),
  ctrl = require('./slug.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/slug').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // collection routes
  app.route('/api/me/slug/:slugId').all(policy.isAllowed)
    .get(ctrl.read)
    .post(ctrl.update)
    .delete(ctrl.delete);

  app.route('/api/slug/check').all(policy.isAllowed)
    .post(ctrl.check);

  // Single routes
  app.route('/api/slug/:slugId').all(policy.isAllowed)
    .get(ctrl.read)
    .put(ctrl.update)
    .delete(ctrl.delete);

  // Finish by binding the middleware
  app.param('slugId', ctrl.findByID);
};
