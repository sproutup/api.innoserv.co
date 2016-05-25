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
  User = dynamoose.model('User'),
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
  var _url;
  var _user;
  req.body.invitee = req.body.invitee.toLowerCase().trim();

  Company.getCached(req.body.companyId).then(function(item) {
    _company = item;
    if (!item) {
      return res.status(400).send({
        message: 'No company found.'
      });
    }

    return Company.isMember(item.id, req.user.id);

  }).then(function(isMember) {
    if (isMember || (req.user && req.user.roles.indexOf('admin') > -1)) {
      return User.queryOne('email').eq(req.body.invitee).exec().then(function(user) {
        _user = user;

        return crypto.randomBytes(20);
      }).then(function(buffer) {
        var token = buffer.toString('hex');
        redis.hmset('token:' + token, { 'invitee': req.body.invitee, 'inviter': req.user.id, 'companyId': _company.id });
        redis.hmset('invite:' + req.body.invitee + ':' + _company.id, { 'token': token, 'companyId': _company.id, 'inviter': req.user.id });
        redis.expire('token:' + token, 604800);
        redis.expire('invite:' + req.body.invitee + ':' + _company.id, 604800);

        if (_user) {
          _url = config.domains.creator + 'select';
        } else {
          _url = config.domains.creator + 'authentication/invite/' + token;
        }

        var to = req.body.invitee;
        var subject = req.user.displayName + ' invited you to join ' + _company.name + ' on SproutUp!';
        var substitutions = {
          ':inviter_name': [req.user.displayName],
          ':company_name': [_company.name],
          ':url': [_url]
        };

        return sendgridService.send(to, subject, substitutions, config.sendgrid.templates.invite);
      }).then(function() {
        return res.status(200).send({
          message: 'Invite email sent.'
        });
      });
    } else {
      return res.status(400).send({
        message: 'The user sending the invite is not a member of this company.'
      });
    }
  }).catch(function(error) {
    console.log('error sending invite email: ', error);
    return res.status(400).send({
      message: 'Error sending invite email.'
    });
  });
};
