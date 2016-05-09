'use strict';

var debug = require('debug')('up:debug:cache:manager:ioredis');
var redis;

/**
 * The cache manager Redis Store module
 * @module redisStore
 * @param {Object} [args] - The store configuration (optional)
 * @param {String} args.host - The Redis server host
 * @param {Number} args.port - The Redis server port
 * @param {Number} args.db - The Redis server db
 * @param {function} args.isCacheableValue - function to override built-in isCacheableValue function (optional)
 */
function ioredisStore(args) {
  var self = {
    name: 'ioredis'
  };

  // cache-manager should always pass in args
  /* istanbul ignore next */
  var redisOptions = args || {};
  redis = args.redis;

  debug('init ttl: ', args.ttl);

  /**
   * Helper to handle callback and release the connection
   * @private
   * @param {Object} conn - The Redis connection
   * @param {Function} [cb] - A callback that returns a potential error and the resoibse
   * @param {Object} [opts] - The options (optional)
   */
  function handleResponse(conn, cb, opts) {
    opts = opts || {};

    return function(err, result) {
      if (err) {
        return cb && cb(err);
      }

      if (opts.parse) {
        result = JSON.parse(result);
      }

      if (cb) {
        cb(null, result);
      }
    };
  }

  /**
   * Get a value for a given key.
   * @method get
   * @param {String} key - The cache key
   * @param {Object} [options] - The options (optional)
   * @param {Function} cb - A callback that returns a potential error and the response
   */
  self.get = function(key, options, cb) {
    if (typeof options === 'function') {
      cb = options;
    }
    debug('get: ' + key);
    redis.get(key, handleResponse(redis, cb, {
      parse: true
    }));
  };

  /**
   * Set a value for a given key.
   * @method set
   * @param {String} key - The cache key
   * @param {String} value - The value to set
   * @param {Object} [options] - The options (optional)
   * @param {Object} options.ttl - The ttl value
   * @param {Function} [cb] - A callback that returns a potential error, otherwise null
   */
  self.set = function(key, value, options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }
    options = options || {};

    var ttl = (options.ttl || options.ttl === 0) ? options.ttl : redisOptions.ttl;

    var val = JSON.stringify(value);

    if (ttl) {
      redis.setex(key, ttl, val, handleResponse(redis, cb));
    } else {
      redis.set(key, val, handleResponse(redis, cb));
    }
  };

  /**
   * Delete value of a given key
   * @method del
   * @param {String} key - The cache key
   * @param {Object} [options] - The options (optional)
   * @param {Function} [cb] - A callback that returns a potential error, otherwise null
   */
  self.del = function(key, options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }

    redis.del(key, handleResponse(redis, cb));
  };

  /**
   * Delete all the keys of the currently selected DB
   * @method reset
   * @param {Function} [cb] - A callback that returns a potential error, otherwise null
   */
  self.reset = function(cb) {
    redis.flushdb(handleResponse(redis, cb));
  };

  /**
   * Returns the remaining time to live of a key that has a timeout.
   * @method ttl
   * @param {String} key - The cache key
   * @param {Function} cb - A callback that returns a potential error and the response
   */
  self.ttl = function(key, cb) {
    conn.ttl(key, handleResponse(redis, cb));
  };

  /**
   * Returns all keys matching pattern.
   * @method keys
   * @param {String} pattern - The pattern used to match keys
   * @param {Function} cb - A callback that returns a potential error and the response
   */
  self.keys = function(pattern, cb) {
    if (typeof pattern === 'function') {
      cb = pattern;
      pattern = '*';
    }

    redis.keys(pattern, handleResponse(redis, cb));
  };

  /**
   * Specify which values should and should not be cached.
   * If the function returns true, it will be stored in cache.
   * By default, it caches everything except null and undefined values.
   * Can be overriden via standard node-cache-manager options.
   * @method isCacheableValue
   * @param {String} value - The value to check
   * @return {Boolean} - Returns true if the value is cacheable, otherwise false.
   */
  self.isCacheableValue = args.isCacheableValue || function(value) {
    return value !== null && value !== undefined;
  };

  return self;
}

module.exports = {
  create: function(args) {
    return ioredisStore(args);
  }
};
