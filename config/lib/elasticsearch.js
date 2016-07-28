'use strict';

var Promise = require('bluebird');
var config = require('../config');
var chalk = require('chalk');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
  host: config.elasticsearch.host,
  log: config.elasticsearch.log
});

console.log('--');
console.log(chalk.green('Elasticsearch'));
console.log(chalk.green('Host:\t', config.elasticsearch.host));


client.ping({
  // ping usually has a 3000ms timeout
  requestTimeout: Infinity,
  // undocumented params are appended to the query string
  hello: 'elasticsearch!'
}).then(function (response) {
  console.log(chalk.green('Elasticsearch ping ok'));
}).catch(function(err){
  console.log(chalk.red('elasticsearch cluster is down!'));
});

module.exports = client;
