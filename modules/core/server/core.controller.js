'use strict';

var config = require('config/config'),
  sendgrid = require('sendgrid')(config.sendgrid.username, config.sendgrid.pass),
  redis = require('config/lib/redis');

// SENDGRID TEST. THIS CAN BE ERASED AFTER SENDGRID IS IMPLIMENTED 
// var email = new sendgrid.Email();
// email.addTo('tbobrien612@gmail.com');
// email.subject = 'Send with templates app';
// email.from = 'test@sproutup.co';
// email.text = 'hey';
// email.html = '<div></div>';
// email.addSubstitution(':user', 'test User');

// email.setFilters({
//   'templates': {
//       'settings': {
//           'enable': 1,
//           'template_id' : '0d97d47d-3d32-499d-9cd9-b5c23c24c592'
//       }
//   }
// });

// sendgrid.send(email, function(err, json) {
//   if (err) { return console.error('err with email', err); }
//   console.log('email success', json);
// });

/**
 * Render the main application page
 */
exports.renderIndex = function (req, res) {
  res.render('modules/core/server/index', {
    user: req.user || null, title: 'SproutUp Dashboard for Brands'
  });
};

/**
 * Render the server error page
 */
exports.renderServerError = function (req, res) {
  res.status(500).render('modules/core/server/500', {
    error: 'Oops! Something went wrong...'
  });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {

  res.status(404).format({
    'text/html': function () {
      res.render('modules/core/server/404', {
        url: req.originalUrl
      });
    },
    'application/json': function () {
      res.json({
        error: 'Path not found'
      });
    },
    'default': function () {
      res.send('Path not found');
    }
  });
};
