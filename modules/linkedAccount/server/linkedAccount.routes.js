'use strict';

/**
 * Module dependencies.
 */
var //articlesPolicy = require('../policies/articles.server.policy'),
  linkedAccount = require('./linkedAccount.controller');

module.exports = function (app) {
  // Articles collection routes
  app.route('/api/linked/account') //.all(articlesPolicy.isAllowed)
    .get(linkedAccount.list);

  app.route('/api/linked/account/init') //.all(articlesPolicy.isAllowed)
    .get(linkedAccount.init);

  app.route('/api/linked/account/next') //.all(articlesPolicy.isAllowed)
    .get(linkedAccount.next);

  // Single linkedAccount routes
  app.route('/api/linked/account/:linkedAccountId')//.all(articlesPolicy.isAllowed)
    .get(linkedAccount.read);

  // Finish by binding the linkedAccount middleware
  app.param('linkedAccountId', linkedAccount.linkedAccountByID);
};
