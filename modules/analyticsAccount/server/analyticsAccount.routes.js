'use strict';

/**
 * Module dependencies.
 */
var //articlesPolicy = require('../policies/articles.server.policy'),
  account = require('./analyticsAccount.controller');

module.exports = function (app) {
  // Articles collection routes
  app.route('/api/analytics/account')//.all(articlesPolicy.isAllowed)
    .get(account.list);

  app.route('/api/analytics/account/init') //.all(articlesPolicy.isAllowed)
    .get(account.init);

  app.route('/api/analytics/account/queue') //.all(articlesPolicy.isAllowed)
    .get(account.listQueue);

  app.route('/api/analytics/account/next') //.all(articlesPolicy.isAllowed)
    .get(account.next);

  app.route('/api/analytics/account/:accountId')//.all(articlesPolicy.isAllowed)
    .get(account.read);

  // Finish by binding the article middleware
  app.param('accountId', account.accountById);
};
