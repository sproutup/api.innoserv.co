'use strict';

/**
 * Module dependencies.
 */

/* global -Promise */
var Promise = require('bluebird'),
  config = require('config/config'),
  cache = require('config/lib/cache'),
  dynamoose = require('dynamoose'),
  debug = require('debug')('up:debug:user:invite:ctrl'),
  sendgrid = require('sendgrid')(config.sendgrid.username, config.sendgrid.pass),
  sendgridService = Promise.promisifyAll(require('modules/sendgrid/server/sendgrid.service')),
  Company = dynamoose.model('Company'),
  redis = require('config/lib/redis'),
  crypto = Promise.promisifyAll(require('crypto'));

exports.sendInvite = function(req, res) {
  if (!req.user || !req.user.id) {
    return res.status(400).send({
      message: 'No user authorized.'
    });
  } else if (!req.body || !req.body.invitee || !req.body.companyId) {
    return res.status(400).send({
      message: 'Missing invite param.'
    });
  }

  var _company;
  Company.getCached(req.body.companyId).then(function(item) {
    _company = item;
    if (!item) {
      return res.status(400).send({
        message: 'No company found.'
      });
    }

    return Company.isMember(item.id, req.user.id);
  }).then(function(isMember) {
    if (isMember) {
      return crypto.randomBytes(20);
    } else {
      return res.status(400).send({
        message: 'The user sending the invite is not a member of this company.'
      });
    }
  }).then(function(buffer) {
    var token = buffer.toString('hex');
    redis.set('token:' + token, { 'invitee': req.body.invitee, 'inviter': req.user.id, 'companyId': _company.id },  'EX', 604800);
    redis.set(req.body.invitee + ':' + _company.id, { 'token': token, 'inviter': req.user.id }, 'EX', 604800);

    var url = config.domains.creator + 'api/auth/invite/confirmation/' + token;
    var to = req.body.invitee;
    var subject = req.user.displayName + ' invited to join ' + _company.name + ' on SproutUp!';
    var substitutions = {
      ':inviter_name': [req.user.displayName],
      ':company_name': [_company.name],
      ':url': [url]
    };

    return sendgridService.send(to, subject, substitutions, config.sendgrid.templates.invite);
  }).then(function() {
    return res.status(200).send({
      message: 'Invite email sent.'
    });
  }).catch(function(error) {
    console.log('error sending invite email: ', error);
    return res.status(400).send({
      message: 'Error sending invite email.'
    });
  });
};
