'use strict';

/**
 * Module dependencies.
 */
var companyPolicy = require('./company.policy'),
  companies = require('./company.controller');

module.exports = function (app) {
  // Articles collection routes
  app.route('/api/company').all(companyPolicy.isAllowed)
    .get(companies.list)
    .post(companies.create);

  // Single article routes
  app.route('/api/company/:companyId').all(companyPolicy.isAllowed)
    .get(companies.read)
    .put(companies.update)
    .delete(companies.delete);

  // Single article routes
  app.route('/api/company/slug/:companySlug').all(companyPolicy.isAllowed)
    .get(companies.read)
    .put(companies.update)
    .delete(companies.delete);

  // Finish by binding the company middleware
  app.param('companyId', companies.companyByID);
  app.param('companySlug', companies.companyBySlug);
};
