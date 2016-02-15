'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/errors.controller')),
  dynamoose = require('dynamoose'),
  User = dynamoose.model('User'),
  _File = require('dynamoose').model('File');

/**
 * Update user details
 */
exports.update = function (req, res) {
  // Init Variables
  var user = req.user;

  // For security measurement we remove the roles from the req.body object
  delete req.body.roles;

  if (user) {
    // Merge existing user
    user = _.extend(user, req.body);
    user.updated = Date.now();
    user.displayName = user.firstName + ' ' + user.lastName;

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
            res.json(user);
          }
        });
      }
    });
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};

/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {
  var user = req.user;
  var message = null;

  if (user) {
    user.avatar = {fileId: req.body.fileId};
    User.update({id: user.id}, {avatar:{fileId: req.body.fileId}},function (saveError) {
      if (saveError) {
        console.log('err:', saveError);
        return res.status(400).send({
          message: errorHandler.getErrorMessage(saveError)
        });
      } else {
        _File.get(user.avatar.fileId).then(function(file){
          if(file){
            file.addCloudfront();
            user.avatar.file = file;
          }
          req.login(user, function (err) {
            if (err) {
              res.status(400).send(err);
            } else {
              res.json(user);
            }
          });
        })
        .catch(function(err){
          console.log('err', err);
          res.status(400).send(err);
        });

      }
    });
  } else {
    res.status(400).send({
      message: 'User is not signed in'
    });
  }
};

/**
 * Send User
 */
exports.me = function (req, res) {
  res.json(req.user || null);
};
