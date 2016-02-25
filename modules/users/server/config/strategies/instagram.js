'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  InstagramStrategy = require('passport-instagram').Strategy,
  users = require('../../controllers/users.server.controller');

module.exports = function (config) {
  // Use instagram strategy
  passport.use(new InstagramStrategy({
      clientID: config.instagram.clientID,
      clientSecret: config.instagram.clientSecret,
      callbackURL: config.instagram.callbackURL,
      profileFields: ['id', 'name', 'displayName', 'emails', 'photos'],
      passReqToCallback: true
    },
    function (req, accessToken, refreshToken, profile, done) {
      // Set the provider data and include tokens
      var providerData = profile._json.data;
      providerData.accessToken = accessToken;
      providerData.refreshToken = refreshToken;

      // Create the user OAuth profile
      var providerUserProfile = {
        displayName: profile.displayName,
        profileImageURL: profile.profile_picture,
        provider: 'instagram',
        providerIdentifierField: 'id',
        providerData: providerData
      };

      // Save the user OAuth profile
      users.saveOAuthUserProfile(req, providerUserProfile, done);
    }
  ));
};
