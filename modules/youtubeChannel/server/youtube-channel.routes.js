'use strict';

/**
 * Module dependencies.
 */
var controller = require('./youtube-channel.controller');

module.exports = function (app) {
  // Articles collection routes
  app.route('/api/user/youtube/channel')
    .get(controller.list);
//    .post(controller.create);
/*
  // Single article routes
  app.route('/api/articles/:articleId')
    .get(controller.read)
    .put(controller.update)
    .delete(controller.delete);
*/
  // Finish by binding the article middleware
//  app.param('articleId', controller.userReachByID);
};
