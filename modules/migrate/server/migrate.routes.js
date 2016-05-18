'use strict';

/**
 * Module dependencies.
 */
var migratePolicy = require('./migrate.policy'),
  migrate = require('./migrate.controller');

module.exports = function (app) {
  app.route('/api/migrate')//.all(migratePolicy.isAllowed)
    .get(migrate.list);

  app.route('/api/migrate/upgrade')//.all(migratePolicy.isAllowed)
    .get(migrate.upgrade);

  // Finish by binding the company middleware
//  app.param('companySlug', companies.companyBySlug);
};
