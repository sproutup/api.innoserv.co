'use strict';

/**
 * Module dependencies.
 */
var debug = require('debug')('up:debug:google:strategy');
var moment = require('moment');
var passport = require('passport'),
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  users = require('../../controllers/users.server.controller');

module.exports = function (config) {
  // Use google strategy
  passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL,
      passReqToCallback: true
    },
    function (req, accessToken, refreshToken, params, profile, done) {
      // Set the provider data and include tokens
      var providerData = profile._json;
      providerData.accessToken = accessToken;
      providerData.refreshToken = refreshToken;
      if(params.expires_in){
        providerData.expires_in = params.expires_in;
        providerData.expires = moment().add(params.expires_in, 's').valueOf();
        debug('expires: ', providerData.expires);
      }

      // Create the user OAuth profile
      var providerUserProfile = {
        firstName: profile.name ? profile.name.givenName : '',
        lastName: profile.name ? profile.name.familyName : '',
        displayName: profile.displayName,
        email: profile.emails ? profile.emails[0].value : '',
        username: profile.username,
        profileImageURL: (providerData.picture) ? providerData.picture : undefined,
        provider: 'google',
        providerIdentifierField: 'id',
        providerData: providerData
      };

      // Save the user OAuth profile
      users.saveOAuthUserProfile(req, providerUserProfile, done);
    }
  ));
};
