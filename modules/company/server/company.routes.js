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

  // Save banner picture
  app.route('/api/company/picture').all(companyPolicy.isAllowed)
    .post(companies.changeBannerPicture);

  // Save logo
  app.route('/api/company/logo').all(companyPolicy.isAllowed)
    .post(companies.changeLogo);

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
