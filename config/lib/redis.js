'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  chalk = require('chalk'),
  Redis = require('ioredis');

console.log('redis connected');

var redis = new Redis({
    port: 6379,          // Redis port
    host: '127.0.0.1'    // Redis host
});

module.exports = redis;

