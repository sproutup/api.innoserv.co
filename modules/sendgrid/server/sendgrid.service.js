'use strict';

/**
 * Module dependencies.
 */
var config = require('config/config');
/* global -Promise */
var Promise = require('bluebird');
var sendgrid = Promise.promisifyAll(require('sendgrid')(config.sendgrid.username, config.sendgrid.pass));

/**
 * Service for all sendgrid emails
 */
exports.send = Promise.method(function(to, subject, substitutions, template) {
  var email = new sendgrid.Email();
  email.addTo(to);
  email.subject = subject;
  email.setSubstitutions(substitutions);
  email.from = 'mailer@sproutup.co';
  email.fromname = 'SproutUp';
  email.html = '<div></div>';
  email.setFilters({
    'templates': {
      'settings': {
        'enable': 1,
        'template_id': template
      }
    }
  });

  if (config.sendgrid && config.sendgrid.local) {
    console.log('We didn\'t send an email. Here are the sendgrid substitutions: ', substitutions);
    console.log('Here\'s the template we would\'ve used: ', template);
    return 'OK';
  } else {
    return sendgrid.sendAsync(email);
  }
});

/**
 * Service for sending sendgrid emails to all members of a company
 */
// exports.sendToCompanyUsers = function(emailObj, companyId, template) {
//   if (emailObj) {
//     emailObj.setFilters({
//       'templates': {
//         'settings': {
//           'enable': 1,
//           'template_id': template
//         }
//       }
//     });

//     if (config.sendgrid && config.sendgrid.local) {
//       console.log('We didn\'t send an email. Here\'s the url we would\'ve put in it: ', url);
//       console.log('Here\'s the template we would\'ve used: ', template);
//       if (callback) {
//         callback();
//       }
//     } else {
//       sendgrid.send(emailObj, function(err, json) {
//       });
//     }
//   }
// };