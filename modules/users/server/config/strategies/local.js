'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport');
var Promise = require('bluebird');
var LocalStrategy = require('passport-local').Strategy;
var dynamoose = require('dynamoose');
var User = dynamoose.model('User');
var Provider = dynamoose.model('Provider');
var _File = dynamoose.model('File');
var debug = require('debug')('up:debug:strategy:local');

module.exports = function () {
  // Use local strategy
  passport.use(new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    },
    function (username, password, done) {
      debug('password provider');
      var userId;
      Promise.try(function(){
        return Provider.get({
          id: username.toLowerCase().trim(),
          provider: 'password'
        });
      }).then(function(provider){
        if(!provider){
          debug('provider not found', provider);
          throw { message: 'Invalid username or password' };
        }
        debug('found password provider');
        userId = provider.userId;
        return provider.authenticate(password);
      }).then(function(isAuthenticated){
        if(!isAuthenticated){
          throw { message: 'Invalid username or password' };
        }
        debug('authenticated user');
        return User.getCached(userId);
      }).asCallback(done);
    }
  ));
};

