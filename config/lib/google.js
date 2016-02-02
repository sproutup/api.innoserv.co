'use strict';

var google = require('googleapis');
var config = require('config/config');
var chalk = require('chalk');
var scope1 = 'https://www.googleapis.com/auth/calendar';
var scope2 = 'https://www.googleapis.com/auth/calendar.readonly';
var jwtKey = config.google.jwt.private_key.replace(/\\n/g, '\n');
var jwtClient = new google.auth.JWT(config.google.jwt.client_email, null, jwtKey, [scope1, scope2], null);


console.log('--');
console.log(chalk.green('Google Calendar'));
console.log(chalk.green('Calendar ID:\t', config.google.calendar.id));
console.log(chalk.green('Email:\t', config.google.jwt.client_email));

// Initialize Google
module.exports.connect = function (cb) {
  jwtClient.authorize(function(err, tokens) {
    if (err) {
      console.log(chalk.red('err authorizing the google jwt', err));
    } else {
      console.log(chalk.green('success authorizing the google jwt in google.js'));
    }
  });
};

module.exports.client = jwtClient;
