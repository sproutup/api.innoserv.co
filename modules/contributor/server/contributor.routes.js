'use strict';

/**
 * Module dependencies.
 */
var policy = require('./contributor.policy'),
  ctrl = require('./contributor.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/contributor').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // collection routes
  app.route('/api/campaign/:campaignId/user').all(policy.isAllowed)
    .get(ctrl.listByCampaign);

  // single routes
  app.route('/api/campaign/:campaignId/user/:userId').all(policy.isAllowed)
    .get(ctrl.read)
    .delete(ctrl.delete);

  // collection routes
  app.route('/api/user/:userId/campaign').all(policy.isAllowed)
    .get(ctrl.listByUser)
    .delete(ctrl.delete);

  // single routes
  app.route('/api/user/:userId/campaign/:campaignId').all(policy.isAllowed)
    .get(ctrl.read)
    .delete(ctrl.delete);
};
