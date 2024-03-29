'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport');
var config = require('config/config');

module.exports = function (app) {
  // User Routes
  var users = require('../controllers/users.server.controller');

  // Setting up the users password api
  app.route('/api/auth/forgot').post(users.forgot);
  app.route('/api/auth/reset/:token').get(users.validateResetToken);
  app.route('/api/auth/reset/:token').post(users.reset);

  // Setting up the users authentication api
  app.route('/api/auth/signup').post(users.signup);
  app.route('/api/auth/join').post(users.join);
  // app.route('/api/auth/sendGridTest').get(users.sendGridTest);
  app.route('/api/auth/verifyToken').post(users.verifyToken);
  app.route('/api/auth/verifyInviteToken').post(users.verifyInviteToken);
  app.route('/api/auth/useInvite').post(users.useInvite);
  app.route('/api/auth/email/verification').post(users.sendEmailVerification);
  app.route('/api/auth/email/confirmation/:token').get(users.verifyEmailToken);
  app.route('/api/auth/signin').post(users.signin);
  app.route('/api/auth/signout').get(users.signout);

  // Inivites
  app.route('/api/auth/invite').post(users.sendInvite);
  // app.route('/api/auth/invite/confirmation/:token').get(users.verifyInviteToken);

  // Email validation
  app.route('/api/auth/validate/email').post(users.emailIsAvailable);

  // Setting the facebook oauth routes
  app.route('/api/auth/facebook').get(users.oauthCall('facebook', {
    scope: ['email']
  }));
  app.route('/api/auth/facebook/callback').get(users.oauthCallback('facebook'));

  // Setting the facebook oauth routes
  app.route('/api/auth/instagram').get(users.oauthCall('instagram', {
    scope: config.instagram.scope
  }));
  app.route('/api/auth/instagram/callback').get(users.oauthCallback('instagram'));

  // Setting the twitter oauth routes
  app.route('/api/auth/twitter').get(users.oauthCall('twitter'));
  app.route('/api/auth/twitter/callback').get(users.oauthCallback('twitter'));

  // Setting the google oauth routes
  app.route('/api/auth/google').get(users.oauthCall('google', {
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/analytics.readonly'
    ],
    accessType: 'offline',
    approvalPrompt: 'force'
  }));
  app.route('/api/auth/google/callback').get(users.oauthCallback('google'));

  // Setting the linkedin oauth routes
  app.route('/api/auth/linkedin').get(users.oauthCall('linkedin', {
    scope: [
      'r_basicprofile',
      'r_emailaddress'
    ]
  }));
  app.route('/api/auth/linkedin/callback').get(users.oauthCallback('linkedin'));

  // Setting the github oauth routes
  app.route('/api/auth/github').get(users.oauthCall('github'));
  app.route('/api/auth/github/callback').get(users.oauthCallback('github'));

  // Setting the paypal oauth routes
  app.route('/api/auth/paypal').get(users.oauthCall('paypal'));
  app.route('/api/auth/paypal/callback').get(users.oauthCallback('paypal'));
};
