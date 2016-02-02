'use strict';

/**
 * Module dependencies.
 */
var productsPolicy = require('./products.policy'),
  products = require('./products.controller');

module.exports = function (app) {
  // Products collection routes
  app.route('/api/products').all(productsPolicy.isAllowed)
    .get(products.list)
    .post(products.create);

  // Single article routes
  app.route('/api/products/:productId').all(productsPolicy.isAllowed)
    .get(products.read)
    .put(products.update)
    .delete(products.delete);

  // Finish by binding the article middleware
  app.param('productId', products.productByID);
};
