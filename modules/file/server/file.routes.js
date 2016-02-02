'use strict';

/**
 * Module dependencies.
 */
var policy = require('./file.policy'),
  ctrl = require('./file.controller');

module.exports = function (app) {
  // collection routes
  app.route('/api/file').all(policy.isAllowed)
    .get(ctrl.list)
    .post(ctrl.create);

  // collection routes
  app.route('/api/file/signature').all(policy.isAllowed)
    .post(ctrl.signature);

  // Single routes
  app.route('/api/file/:fileId').all(policy.isAllowed)
    .get(ctrl.read)
    .put(ctrl.update)
    .delete(ctrl.delete);

  // Single routes
  app.route('/api/user/:userId/file').all(policy.isAllowed)
    .get(ctrl.listByUser);


  // Finish by binding the middleware
  app.param('fileId', ctrl.findByID);
};
