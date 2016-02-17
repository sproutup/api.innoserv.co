'use strict';

/**
 * Module dependencies.
 */
var policy = require('./message.policy'),
  ctrl = require('./message.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/message').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // Single routes
  app.route('/api/message/:messageId').all(policy.isAllowed)
    .get(ctrl.read)
    .put(ctrl.update)
    .delete(ctrl.delete);

  // Finish by binding the middleware
  app.param('messageId', ctrl.findByID);
};
