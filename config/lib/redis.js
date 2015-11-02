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
console.log(chalk.green('Db:\t', config.redis.db));

var redis = new Redis(config.redis);

module.exports = redis;

