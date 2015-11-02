'use strict';

/**
 * Module dependencies.
 */
var controller = require('./user-reach.controller');

module.exports = function (app) {
  // Articles collection routes
  app.route('/api/user/reach')
    .get(controller.list);
//    .post(controller.create);

  // Single article routes
  app.route('/api/user/:userId/reach')
    .get(controller.read);

  // Finish by binding the middleware
  app.param('userId', controller.userReachByID);
};
