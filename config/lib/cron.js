'use strict';

/**
 * Module dependencies.
 */
var config = require('../config');
var CronJob = require('cron').CronJob;
var chalk = require('chalk');
var debug = require('debug')('up:debug:cron');

var dynamoose = require('dynamoose');
var Service = dynamoose.model('Service');
var Provider = dynamoose.model('Provider');
var Content = dynamoose.model('Content');

console.log('--');
console.log(chalk.green('Cron Jobs'));

var cronTimeProviders = '*/11 * * * * *';
var cronTimeMetrics = '*/5 * * * * *';
var cronTimeContent = '*/6 * * * * *';

console.log(chalk.green(cronTimeProviders + '\t expired providers'));
new CronJob(cronTimeProviders,
  function() {
    return Provider.fetchServiceForOldest();
  },
  null,
  true);


console.log(chalk.green(cronTimeMetrics + '\t expired metrics'));
new CronJob(cronTimeMetrics,
  function() {
    return Service.fetchMetricForOldest();
  },
  null,
  true);


console.log(chalk.green(cronTimeMetrics + '\t expired content'));
new CronJob(cronTimeContent,
  function() {
    return Content.processOldestContent();
  },
  null,
  true);


module.exports = CronJob;
