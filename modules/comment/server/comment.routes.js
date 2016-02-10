'use strict';

/**
 * Module dependencies.
 */
var policy = require('./comment.policy'),
  ctrl = require('./comment.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/comment').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // Single routes
  app.route('/api/comment/:commentId').all(policy.isAllowed)
    .get(ctrl.read)
    .put(ctrl.update)
    .delete(ctrl.delete);

  // Finish by binding the middleware
  app.param('commentId', ctrl.findByID);
};
