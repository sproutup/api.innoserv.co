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
      resources: '/api/campaign',
      permissions: '*'
    }, {
      resources: '/api/campaign/template',
      permissions: '*'
    }, {
      resources: '/api/campaign/:campaignId',
      permissions: '*'
    }, {
      resources: '/api/table/campaign',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/campaign',
      permissions: ['get', 'post']
    }, {
      resources: '/api/campaign/:campaignId',
      permissions: ['*']
    }, {
      resources: '/api/campaign/template',
      permissions: ['get']
    }, {
      resources: '/api/company/:companyId/campaign',
      permissions: ['*']

    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/campaign',
      permissions: ['*']
    }, {
      resources: '/api/campaign/template',
      permissions: '*'
    }, {
      resources: '/api/campaign/:campaignId',
      permissions: ['*']
    }, {
      resources: '/api/company/:companyId/campaign',
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
  if (req.campaign && req.user && req.campaign.user.id === req.user.id) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred.
      return res.status(500).send('Unexpected authorization error');
    } else {
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
