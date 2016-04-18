'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');
var _ = require('lodash');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/slug',
      permissions: '*'
    }, {
      resources: '/api/me/slug',
      permissions: '*'
    }, {
      resources: '/api/slug/:slugId',
      permissions: '*'
    }]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/api/slug',
      permissions: ['get', 'post']
    }, {
      resources: '/api/slug/check',
      permissions: ['*']
    }, {
      resources: '/api/slug/:slugId',
      permissions: ['*']
    }]
  }, {
    roles: ['guest'],
    allows: [{
      resources: '/api/slug',
      permissions: ['*']
    }, {
      resources: '/api/slug/check',
      permissions: ['*']
    }, {
      resources: '/api/slug/:slugId',
      permissions: ['*']
    }]
  }]);
};

/**
 * Check If Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an item is being processed and the current user created it then allow any manipulation
  console.log('item: ', req.item);
  if (req.model && req.user && req.item) {
    switch(req.model.refType){
      case 'Company':
        console.log('found company: ', req.user.id);
        if(req.item.team && _.findIndex(req.item.team, function(o){
          console.log('compare: ', o.userId);
          return o.userId === req.user.id;
        })!==-1){ return next(); }
        break;
      case 'User':
        console.log('found user: ', req.user.username);
        if(req.user.id === req.item.id) {
          console.log('its me !');
          return next();
        }
        break;
      case 'Campaign':
        console.log('found campaign');
        break;
    }
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

