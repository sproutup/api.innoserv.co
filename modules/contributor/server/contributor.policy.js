'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/contributor',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/contributor',
      permissions: ['get', 'post']
    }, {
      resources: '/api/campaign/:campaignId/user',
      permissions: ['get']
    }, {
      resources: '/api/user/:userId/campaign',
      permissions: ['*']
    }, {
      resources: '/api/campaign/:campaignId/user/:userId',
      permissions: ['*']
    }, {
      resources: '/api/user/:userId/campaign/:campaignId',
      permissions: ['*']
   }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/contributor',
      permissions: ['*']
    }, {
      resources: '/api/campaign/:campaignId/user',
      permissions: ['*']
    }, {
      resources: '/api/user/:userId/campaign',
      permissions: ['*']
    }, {
      resources: '/api/campaign/:campaignId/user/:userId',
      permissions: ['*']
    }, {
      resources: '/api/user/:userId/campaign/:campaignId',
      permissions: ['*']
    }]
  }]);
};

/**
 * Check If Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an article is being processed and the current user created it then allow any manipulation
//  if (req.team && req.user && req.team.user.id === req.user.id) {
//    return next();
//  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred.
      return res.status(500).send('Unexpected authorization error');
    } else {
      console.log(isAllowed, req.route.path, roles);
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
