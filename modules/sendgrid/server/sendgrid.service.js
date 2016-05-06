'use strict';

/**
 * Module dependencies.
 */
var config = require('config/config');
/* global -Promise */
var Promise = require('bluebird');
var debug = require('debug')('up:debug:sendgrid:service');
var dynamoose = require('dynamoose');
var sendgrid = Promise.promisifyAll(require('sendgrid')(config.sendgrid.username, config.sendgrid.pass));
var Team = dynamoose.model('Team');
var User = dynamoose.model('User');
var knex = require('config/lib/bookshelf').knex;
var _this = this;

/**
 * Service for all sendgrid emails
 */
exports.send = Promise.method(function(to, subject, substitutions, template) {
  var email = new sendgrid.Email();
  email.addTo(to);
  email.subject = subject;
  email.from = 'mailer@sproutup.co';
  email.fromname = 'SproutUp';
  email.html = '<div></div>';
  email.setSubstitutions(substitutions);
  email.setFilters({
    'templates': {
      'settings': {
        'enable': 1,
        'template_id': template
      }
    }
  });

  if (config.sendgrid && config.sendgrid.local) {
    debug('We didn\'t send an email to ' + to + '. Here are the sendgrid substitutions: ', substitutions);
    debug('Sendgrid template id: ', template);
    debug('Email subject: ', subject);
    return substitutions;
  } else {
    return sendgrid.sendAsync(email);
  }
});

/**
 * Send to a user
 */
exports.sendToUser = function(userId, subject, substitutions, template) {
  return User.get(userId)
    .then(function(user) {
      return _this.send(user.email, subject, substitutions, template);
    })
    .catch(function(error) {
      throw error;
    });
};

/**
 * Send to all members of a company
 */
exports.sendToCompanyUsers = function(companyId, subject, substitutions, template) {
  return Team.query({ companyId: companyId }).exec().then(function(items) {
    return Promise.map(items, function(item) {
      _this.sendToUser(item.userId, subject, substitutions, template);
    });
  });
};

