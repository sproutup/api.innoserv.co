'use strict';

/**
 * Module dependencies.
 */
var migratePolicy = require('./migrate.policy'),
  migrate = require('./migrate.controller');

module.exports = function (app) {
  // Articles collection routes
  app.route('/api/migrate')//.all(migratePolicy.isAllowed)
    .get(migrate.list);
//    .post(migrate.create);

  // Finish by binding the company middleware
//  app.param('companySlug', companies.companyBySlug);
};
