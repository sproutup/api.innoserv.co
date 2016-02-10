'use strict';

/**
 * Module dependencies.
 */
var policy = require('./content.policy'),
  ctrl = require('./content.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/content').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // Single routes
  app.route('/api/content/:contentId').all(policy.isAllowed)
    .get(ctrl.read)
    .put(ctrl.update)
    .delete(ctrl.delete);

  // Single routes
//  app.route('/api/company/:companyId/product').all(policy.isAllowed)
//    .get(ctrl.listByCompany);


  // Finish by binding the middleware
  app.param('contentId', ctrl.findByID);
};
