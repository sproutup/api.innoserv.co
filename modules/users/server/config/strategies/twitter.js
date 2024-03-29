'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy,
  debug = require('debug')('up:debug:twitter:strategy'),
  users = require('../../controllers/users.server.controller');

module.exports = function (config) {
  // Use twitter strategy
  passport.use(new TwitterStrategy({
      consumerKey: config.twitter.clientID,
      consumerSecret: config.twitter.clientSecret,
      callbackURL: config.twitter.callbackURL,
      passReqToCallback: true
    },
    function (req, token, tokenSecret, profile, done) {
      // Set the provider data and include tokens
      var providerData = profile._json;
      providerData.token = token;
      providerData.tokenSecret = tokenSecret;

      // Create the user OAuth profile
      var displayName = profile.displayName.trim();
      var iSpace = displayName.indexOf(' '); // index of the whitespace following the firstName
      var firstName = iSpace !== -1 ? displayName.substring(0, iSpace) : displayName;
      var lastName = iSpace !== -1 ? displayName.substring(iSpace + 1) : '';

      var providerUserProfile = {
        firstName: firstName,
        lastName: lastName,
        displayName: displayName,
        description: providerData.description,
        username: providerData.screen_name,
        profileImageURL: profile.photos[0].value.replace('normal', 'bigger'),
        provider: 'twitter',
        providerIdentifierField: 'id_str',
        providerData: providerData
      };

      debug('username: ', providerUserProfile.username);

      // Save the user OAuth profile
      users.saveOAuthUserProfile(req, providerUserProfile, done);
    }
  ));
};
