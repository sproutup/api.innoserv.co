'use strict';

/**
 * Module dependencies.
 */
var config = require('../config');
var chalk = require('chalk');
var redis = require('./redis');
var ioredis = require('modules/node-cache-manager-ioredis');
var cacheManager = require('cache-manager');
var _ = require('lodash');

var isCacheableValue = function(value) {
  return value !== null && value !== false && !_.isUndefined(value);
};

var redisCache = cacheManager.caching({
  store: ioredis,
  redis: redis,
  isCacheableValue: isCacheableValue,
  db: 0,
  ttl: 20});

var memoryCache = cacheManager.caching({
  store: 'memory',
  // isCacheableValue: isCacheableValue,
  max: 1000,
  ttl: 10 /* seconds */});
var ttl = 10;

var cache = cacheManager.multiCaching([memoryCache, redisCache], { isCacheableValue: isCacheableValue });

console.log('--');
console.log(chalk.green('Cache'));
console.log(chalk.green('Host:\t', config.redis.host));
console.log(chalk.green('Port:\t', config.redis.port));


module.exports =  cache; //redisCache; //memoryCache;

