'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');

/**
 * Extend user's controller
 */
module.exports = _.extend(
  require('./user.authentication.controller'),
  require('./user.authorization.controller'),
  require('./user.password.controller'),
  require('./user.profile.controller')
);
