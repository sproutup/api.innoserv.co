'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  /* global -Promise */
  Promise = require('bluebird'),
  sendgrid = require('sendgrid')(config.sendgrid.username, config.sendgrid.pass),
  sendgridService = Promise.promisifyAll(require('modules/sendgrid/server/sendgrid.service')),
  errorHandler = require(path.resolve('./modules/core/server/errors.controller')),
  dynamoose = require('dynamoose'),
  User = dynamoose.model('User'),
  nodemailer = require('nodemailer'),
  async = require('async'),
  redis = require('config/lib/redis'),
  crypto = require('crypto');

/**
 * Forgot for reset password (forgot POST)
 */
exports.forgot = function (req, res, next) {
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
        User.queryOne({
          email: req.body.email
        }, function (err, user) {
          if (!user) {
            return res.status(400).send({
              message: 'No account with that email has been found'
            });
          } else if (user.provider !== 'local') {
            return res.status(400).send({
              message: 'It seems like you signed up using your ' + user.provider + ' account'
            });
          } else {
            redis.set('token:' + token, user.id, 'EX', 86400);
            done(err, token, user);
          }
        });
      } else {
        return res.status(400).send({
          message: 'Email field must not be blank'
        });
      }
    },
    // If valid email, send reset email using service
    function (token, user, done) {
      var to = user.email;
      var subject = ' ';
      var url = 'http://' + req.headers.host + '/api/auth/reset/' + token;
      var substitutions = {
        ':user': [user.displayName],
        ':url': [url]
      };

      sendgridService.send(to, subject, substitutions, config.sendgrid.templates.forgot.password)
        .then(function() {
          return res.status(200).send({
            message: 'An email has been sent to the provided email with further instructions.',
            emailSent: user.email
          });
        }).catch(function() {
          return res.status(400).send({
            message: 'The email failed to send'
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
          User.get({
            id: result
          }, function (err, user) {
            if (!err && user) {
              user.changePassword(passwordDetails.newPassword);

              user.save(function (err) {
                if (err) {
                  return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                  });
                } else {
                  req.login(user, function (err) {
                    if (err) {
                      res.status(400).send(err);
                    } else {
                      // Return authenticated user
                      res.json(user);
                      done(err, user);
                    }
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
 * Change Password
 */
exports.changePassword = function (req, res, next) {
  // Init Variables
  var passwordDetails = req.body;
  var message = null;

  if (req.user) {
    if (passwordDetails.newPassword) {
      User.get(req.user.id, function (err, user) {
        if (!err && user) {
          if (user.authenticate(passwordDetails.currentPassword)) {
            user.changePassword(passwordDetails.newPassword);

            user.save(function (err) {
              if (err) {
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              } else {
                req.login(user, function (err) {
                  if (err) {
                    res.status(400).send(err);
                  } else {
                    res.send({
                      message: 'Password changed successfully'
                    });
                  }
                });
              }
            });
          } else {
            res.status(400).send({
              message: 'Current password is incorrect'
            });
          }
        } else {
          res.status(400).send({
            message: 'User is not found'
          });
        }
      });
    } else {
      res.status(400).send({
        message: 'Please provide a new password'
      });
    }
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};
