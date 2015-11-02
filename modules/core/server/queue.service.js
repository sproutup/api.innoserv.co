'use strict';

var redis = require('config/lib/redis');

var CircularQueue = function(key){
  var m = {};
  this.m.key = key;
  this.m.latest = m.key + ':last';
};

CircularQueue.prototype.len = function(){
  return redis.llen(this.m.key);
};

CircularQueue.prototype.next = function(){
  return redis.rpoplpush(this.m.key, this.m.key);
};

/*
 * Add value to queue
 */
CircularQueue.prototype.add = function(val){
  // add the value and set the last value
  redis.pipeline().lpush(this.m.key, val).set(this.m.last, val).exec();
};

CircularQueue.prototype.last = function(){
  redis.get(this.m.last);
};

CircularQueue.prototype.clear = function(val){
  redis.del(this.m.key);
  redis.del(this.m.latest);
};

