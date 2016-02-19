'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  chalk = require('chalk'),
  Redis = require('ioredis');

console.log('--');
console.log(chalk.green('Redis'));
console.log(chalk.green('Host:\t', config.redis.host));
console.log(chalk.green('Port:\t', config.redis.port));


var redis = new Redis({
    port: config.redis.port,   // Redis port
    host: config.redis.host    // Redis host
});

redis.on('connect', function () {
  console.log(chalk.blue('Redis:\tConnected'));
});

redis.on('error', function (err) {
  console.log(chalk.red('Redis:\tError', err));
});


module.exports = redis;
