'use strict';

/**
 * Module dependencies.
 */
var policy = require('./youtube.policy'),
  ctrl = require('./youtube.controller');

module.exports = function (app) {
  // collection routes
/*  app.route('/api/file').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // Single routes
  app.route('/api/file/:fileId').all(policy.isAllowed)
    .get(ctrl.read)
    .put(ctrl.update)
    .delete(ctrl.delete);
*/
  // Single routes
  app.route('/api/user/:userId/youtube/video')//.all(policy.isAllowed)
    .get(ctrl.listVideos);

  app.route('/api/me/youtube/video').all(policy.isAllowed)
    .get(ctrl.listMyVideos);

  // Finish by binding the middleware
//  app.param('videoId', ctrl.findByID);
};


