'use strict';

/**
 * Module dependencies.
 */
var policy = require('./member.policy'),
  ctrl = require('./member.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/member').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // Single routes
  app.route('/api/member/:memberId').all(policy.isAllowed)
    .get(ctrl.read)
    .put(ctrl.update)
    .delete(ctrl.delete);

  // Single routes
  app.route('/api/channel/:channelId/member').all(policy.isAllowed)
    .get(ctrl.findByChannel);

  // Finish by binding the middleware
  app.param('memberId', ctrl.findByID);
};
