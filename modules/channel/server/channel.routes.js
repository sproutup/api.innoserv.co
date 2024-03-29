'use strict';

/**
 * Module dependencies.
 */
var policy = require('./channel.policy'),
  ctrl = require('./channel.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/channel').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  app.route('/api/campaign/:campaignId/channel').all(policy.isAllowed)
    .post(ctrl.createCampaignChannel);

  // Single routes
  app.route('/api/channel/:channelId').all(policy.isAllowed)
    .get(ctrl.read)
    .put(ctrl.update)
    .delete(ctrl.delete);

  app.route('/api/my/channel').all(policy.isAllowed)
    .get(ctrl.listByUser);

  // Single routes
  app.route('/api/my/channel/ref/:id').all(policy.isAllowed)
    .get(ctrl.findByRefId)
    .post(ctrl.findByRefId);

  // Finish by binding the middleware
  app.param('channelId', ctrl.findByID);
};
