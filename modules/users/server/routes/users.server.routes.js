'use strict';

module.exports = function (app) {
  // User Routes
  var users = require('../controllers/users.server.controller');

  // Setting up the users profile api
  app.route('/api/users/me').get(users.me);
  app.route('/api/users').put(users.update);
  app.route('/api/users/accounts').delete(users.removeOAuthProvider);
  app.route('/api/users/picture').post(users.changeProfilePicture);
  app.route('/api/users/password')
    .put(users.changePassword)
    .post(users.createPassword);

  // Finish by binding the user middleware
  app.param('userId', users.userByID);
};