'use strict';

/**
 * Module dependencies.
 */

/* global -Promise */
var Promise = require('bluebird');
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/errors.controller')),
  dynamoose = require('dynamoose'),
  User = dynamoose.model('User'),
  Slug = dynamoose.model('Slug'),
  _File = require('dynamoose').model('File');

/**
 * Update user details
 */
exports.update = function (req, res) {
  // Init Variables
  var user = _.omit(req.body, ['id', 'roles']);
  user.updated = Date.now();

  Promise.try(function(){
    if(user.username !== req.user.username){
      console.log('changing username', user.username);
      return Slug.change({id: user.username, refId: req.user.id, refType: 'User'}, req.user.username).then(function(val){
        return;
      }).catch(function(err){
        delete user.username;
        return;
      });
    }
    else{
      return;
    }
  }).then(function(){
    if(user && user.email && user.email.toLowerCase().trim() !== req.user.email) {
      console.log('changing email', user.email);
      user.emailConfirmed = false;
      return User.changeEmail(req.user.id, user.email);
    }
    else{
      return;
    }
  }).then(function(){
    console.log('updating user', user);
    return User.update({ id: req.user.id }, user, function (error, modified) {
      if (error) {
        console.log('error:', error);
        return res.status(400).send({
          message: error
        });
      } else {
        User.getPopulated(req.user.id).then(function(updated){
//        var updated = _.extend(user, req.user, {username: user.username});
          console.log('updated user', updated);
          req.login(updated, function (err) {
            if (err) {
              return res.status(400).send(err);
            } else {
              return res.json(updated);
            }
          });
        });
      }
    });
  });
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
