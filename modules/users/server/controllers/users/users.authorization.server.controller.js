'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  dynamoose = require('dynamoose'),
  User = dynamoose.model('User');

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  if (!_.isString(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.get(id).then(function(item){
    req.profile = item;
    next();
  })
  .catch(function (err) {
    return next(err);
  });
};
