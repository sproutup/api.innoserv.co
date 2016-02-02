'use strict';

/**
 * Module dependencies.
 */
var policy = require('./team.policy'),
  ctrl = require('./team.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/team').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // collection routes
  app.route('/api/company/:companyId/user').all(policy.isAllowed)
    .get(ctrl.listByCompany);

  // single routes
  app.route('/api/company/:companyId/user/:userId').all(policy.isAllowed)
    .get(ctrl.read)
    .delete(ctrl.delete);

  // collection routes
  app.route('/api/user/:userId/company').all(policy.isAllowed)
    .get(ctrl.listByUser)
    .delete(ctrl.deleteByUser);

  // single routes
  app.route('/api/user/:userId/company/:companyId').all(policy.isAllowed)
    .get(ctrl.read)
    .delete(ctrl.delete);
};
