'use strict';

/**
 * Module dependencies.
 */
var config = require('config/config');
var sendgrid = require('sendgrid')(config.sendgrid.username, config.sendgrid.pass);

/**
 * Service for all sendgrid emails
 */
exports.send = function(email, template, url, callback) {
  if (email) {
    email.setFilters({
      'templates': {
        'settings': {
          'enable': 1,
          'template_id': template
        }
      }
    });

    if (config.sendgrid && config.sendgrid.local) {
      console.log('We didn\'t send an email. Here\'s the url we would\'ve put in it: ', url);
      console.log('Here\'s the template we would\'ve used: ', template);
      if (callback) {
        callback();
      }
    } else {
      sendgrid.send(email, function(err, json) {
        if (callback) {
          callback(err);
        }
      });
    }
  }
};