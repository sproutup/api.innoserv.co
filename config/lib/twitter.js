'use strict';

var Twit = require('twit'),
    chalk = require('chalk'),
    /* global -Promise */
    Promise = require('bluebird'),
    config = require('config/config');

console.log('--');
console.log(chalk.green('Twitter API'));
console.log(chalk.green('clientID:\t', config.twitter.clientID));
console.log(chalk.green('accessID:\t', config.twitter.accessID));
console.log('--');

var T = new Twit({
  consumer_key:         config.twitter.clientID,
  consumer_secret:      config.twitter.clientSecret,
  access_token:         config.twitter.accessID,
  access_token_secret:  config.twitter.accessSecret
});

module.exports = Promise.promisifyAll(T);
