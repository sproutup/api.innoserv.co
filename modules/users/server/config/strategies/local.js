'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  User = require('dynamoose').model('User'),
  _File = require('dynamoose').model('File');

module.exports = function () {
  // Use local strategy
  passport.use(new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    },
    function (username, password, done) {
      User.queryOne({
        email: username
      }, function (err, user) {
        if (err) {
          return done(err);
        }
        if (!user ||
          !user.authenticate(password)) {
          return done(null, false, {
            message: 'Invalid username or password'
          });
        }

        if(user.avatar.fileId){
          _File.get(user.avatar.fileId).then(function(file){
            if(file){
              user.avatar.file = file;
            }
            return done(null, user);
          })
          .catch(function(err){
            return done(null, user);
          });
        }
      });
    }
  ));
};
