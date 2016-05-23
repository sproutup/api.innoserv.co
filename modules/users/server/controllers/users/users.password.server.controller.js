'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  cache = require('config/lib/cache'),
  /* global -Promise */
  Promise = require('bluebird'),
  sendgrid = require('sendgrid')(config.sendgrid.username, config.sendgrid.pass),
  sendgridService = Promise.promisifyAll(require('modules/sendgrid/server/sendgrid.service')),
  errorHandler = require(path.resolve('./modules/core/server/errors.controller')),
  dynamoose = require('dynamoose'),
  debug = require('debug')('up:debug:user:password:controller'),
  User = dynamoose.model('User'),
  Provider = dynamoose.model('Provider'),
  nodemailer = require('nodemailer'),
  async = require('async'),
  redis = require('config/lib/redis'),
  crypto = require('crypto');

/**
 * Forgot for reset password (forgot POST)
 */
exports.forgot = function (req, res, next) {
  var _provider;

  async.waterfall([
    // Generate random token
    function (done) {
      crypto.randomBytes(20, function (err, buffer) {
        var token = buffer.toString('hex');
        done(err, token);
      });
    },
    // Lookup user by username
    function (token, done) {
      if (req.body.email) {
        Provider.get({
          id: req.body.email,
          provider: 'password'
        }, function (err, provider) {
          _provider = provider;

          if (!provider) {
            return res.status(400).send({
              message: 'No account with that email has been found'
            });
          } else {
            redis.set('token:' + token, provider.id, 'EX', 86400);
            done(err, token);
          }
        });
      } else {
        return res.status(400).send({
          message: 'Email field must not be blank'
        });
      }
    },
    // If valid email, send reset email using service
    function (token, done) {
      User.getCached(_provider.userId).then(function(user) {
        var to = _provider.id;
        var subject = 'Reset your password.';
        var url = 'http://' + req.headers.host + '/api/auth/reset/' + token;
        var substitutions = {
          ':user': [user.displayName],
          ':url': [url]
        };

        return sendgridService.send(to, subject, substitutions, config.sendgrid.templates.forgot.password)
          .then(function() {
            return res.status(200).send({
              message: 'An email has been sent to the provided email with further instructions.',
              emailSent: _provider.id
            });
          }).catch(function() {
            return res.status(400).send({
              message: 'The email failed to send'
            });
          });
      });
    }
    ], function (err) {
      if (err) {
        return next(err);
      }
    });
};

/**
 * Reset password GET from email token
 */
exports.validateResetToken = function (req, res) {
  redis.get('token:' + req.params.token).then(function(result) {
    if (result) {
      res.redirect('/password/reset/' + req.params.token);
    } else {
      return res.redirect('/password/reset/invalid');
    }
  });
};

/**
 * Reset password POST from email token
 */
exports.reset = function (req, res, next) {
  // Init Variables
  var passwordDetails = req.body;
  var message = null;

  async.waterfall([
    function (done) {
      // Get the token in param and use the value (user.id) to find the user to update
      redis.get('token:' + req.params.token).then(function(result) {
        if (result) {
          Provider.get({
            id: result,
            provider: 'password'
          }, function (err, provider) {
            if (!err && provider) {
              provider.changePassword(passwordDetails.newPassword);

              provider.save(function (err) {
                if (err) {
                  return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                } else {
                  User.getCached(provider.userId).then(function(user){
                    debug('user: ', user.id, ' name: ', user.displayName);
                    req.login(user, function (err) {
                      if (err) {
                        res.status(400).send(err);
                      } else {
                        // Return authenticated user
                        res.json(user);
                        done(err, user);
                      }
                    });
                  });
                }
              });
            } else {
              return res.status(400).send({
                message: 'We couldn\'t find the user'
              });
            }
          });
        } else {
          return res.status(400).send({
            message: 'Password reset token is invalid or has expired.'
          });
        }
      });
    }
  ],
  function (err) {
    if (err) {
      return next(err);
    }
  });
};

/**
 * Create Password
 */
exports.createPassword = function (req, res) {
  Provider.createPassword(req.user.email, req.body.password, req.user.id).then(function(item) {
    cache.del('user:' + req.user.id);
    return User.getCached(req.user.id);
  }).then(function(user) {
    req.login(user, function (err) {
      if (err) {
        res.status(400).send(err);
        return;
      } else {
        debug('returning success');
        res.json(user);
        return;
      }
    });
  }).catch(function(err) {
    console.log('error creating password: ', err);
    return res.status(400).send({
      message: 'Your current password is wrong...'
    });
  });
};

/**
 * Change Password
 */
exports.changePassword = function (req, res) {
  // Init Variables
  var passwordDetails = req.body;
  var message = null;
  var _provider;

  Promise.try(function(){
    return Provider.getUserPasswordProvider(req.user.id);
  }).then(function(provider) {
    _provider = provider;
    if(!provider){
      debug('provider not found');
      return res.status(400).send({
        message: 'Your current password is wrong...'
      });
    }
    debug('found password provider');

    // Try to authenticate the user with 'currentPassword'
    return _provider.authenticate(passwordDetails.currentPassword).then(function(isAuthenticated) {
      debug('isAuthenticated ', isAuthenticated);
      if(!isAuthenticated) {
        return res.status(400).send({
          message: 'Your current password is wrong...'
        });
      }

      // Change password, get the user, log them in, and return.
      debug('authenticated user');
      return _provider.changePassword(passwordDetails.newPassword).then(function() {
        debug('save user');
        return _provider.save();
      }).then(function() {
        debug('getCached user');
        return User.getCached(_provider.userId);
      }).then(function(user){
        debug('logging in cached user');
        req.login(user, function (err) {
          if (err) {
            res.status(400).send(err);
            return;
          } else {
            debug('returning success');
            res.send({
              message: 'Password changed successfully'
            });
            return;
          }
        });
      });
    });
  });
};
