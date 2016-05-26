'use strict';

/**
 * Module dependencies.
 */
var migratePolicy = require('./migrate.policy'),
  migrate = require('./migrate.controller');

module.exports = function (app) {
  app.route('/api/migrate/flake')//.all(migratePolicy.isAllowed)
    .get(migrate.flake);

  app.route('/api/migrate/linked')//.all(migratePolicy.isAllowed)
    .get(migrate.linked);

  app.route('/api/migrate/user')//.all(migratePolicy.isAllowed)
    .get(migrate.user);

  app.route('/api/migrate/slug')//.all(migratePolicy.isAllowed)
    .get(migrate.slug);

  app.route('/api/migrate/password')//.all(migratePolicy.isAllowed)
    .get(migrate.slug);

  app.route('/api/migrate/post')//.all(migratePolicy.isAllowed)
    .get(migrate.post);

  app.route('/api/migrate/facebook')//.all(migratePolicy.isAllowed)
    .get(migrate.facebook);

  app.route('/api/migrate')//.all(migratePolicy.isAllowed)
    .get(migrate.list);

  app.route('/api/migrate/upgrade')//.all(migratePolicy.isAllowed)
    .get(migrate.upgrade);

  // Finish by binding the company middleware
//  app.param('companySlug', companies.companyBySlug);
};
