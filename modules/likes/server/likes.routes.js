'use strict';

/**
 * Module dependencies.
 */
var policy = require('./likes.policy'),
  ctrl = require('./likes.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/likes').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // Single routes
  app.route('/api/likes/:likesId').all(policy.isAllowed)
    .get(ctrl.read)
    .delete(ctrl.delete);

  // Finish by binding the middleware
  app.param('likesId', ctrl.findByID);
};
