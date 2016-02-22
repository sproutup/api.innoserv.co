'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  User = require('dynamoose').model('User'),
  path = require('path'),
  config = require(path.resolve('./config/config'));

/**
 * Module init function.
 */
module.exports = function (app, db) {
  // Serialize sessions
  passport.serializeUser(function (user, done) {
    done(null, JSON.stringify(user));
  });

  // Deserialize sessions
  passport.deserializeUser(function (str, done) {
    try {
      var user = JSON.parse(str); // this is how you parse a string into JSON
      done(null, user);
    } catch (err) {
      console.error(err);
      done(err, null);
    }
  });

  // Initialize strategies
  config.utils.getGlobbedPaths(path.join(__dirname, './strategies/**/*.js')).forEach(function (strategy) {
    require(path.resolve(strategy))(config);
  });

  // Add passport's middleware
  app.use(passport.initialize());
  app.use(passport.session());
};
