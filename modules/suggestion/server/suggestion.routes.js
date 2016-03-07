'use strict';

/**
 * Module dependencies.
 */
var policy = require('./suggestion.policy'),
  ctrl = require('./suggestion.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/suggestion').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // Single routes
  app.route('/api/suggestion/:suggestionId').all(policy.isAllowed)
    .get(ctrl.read)
    .put(ctrl.update)
    .delete(ctrl.delete);

  // Single routes
  app.route('/api/user/:userId/suggestion').all(policy.isAllowed)
    .get(ctrl.listByUser);

  // Finish by binding the middleware
  app.param('suggestionId', ctrl.findByID);
};

