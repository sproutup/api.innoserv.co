'use strict';

var redis = require('config/lib/redis');

var CircularQueue = function(key){
  this.m = {
    key: key,
    last: key + ':last'
  };
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
  if (val instanceof Array) {
    console.log('add: ', val.length);
    // add the value and set the last value
    return redis.pipeline()
      .lpush(this.m.key, val)
      .set(this.m.last, val[val.length - 1])
      .exec()
      .then(function(){
        return val;
      });
  } else {
    console.log('add: ', val);
    // add the value and set the last value
    return redis.pipeline()
      .lpush(this.m.key, val)
      .set(this.m.last, val)
      .exec()
      .then(function(){
        return val;
      });
  }
};

/*
 * Add value to queue
 */
CircularQueue.add = function(key, val){
  if (val instanceof Array) {
    console.log('add: ', val.length);
    // add the value and set the last value
    return redis.pipeline()
      .lpush(key, val)
      .exec()
      .then(function(){
        return val;
      });
  } else {
    console.log('add: ', val);
    // add the value and set the last value
    return redis.pipeline()
      .lpush(key, val)
      .exec()
      .then(function(){
        return val;
      });
  }
};

CircularQueue.prototype.list = function(){
  return redis.lrange(this.m.key, 0, -1)
    .then(function(result){
      if (result === null){
        return [];
      }
      else{
        return result;
      }
    });
};


CircularQueue.prototype.last = function(){
  return redis.get(this.m.last)
    .then(function(result){
      if (result === null){
        return -1;
      }
      else{
        return result;
      }
    });
};

CircularQueue.prototype.clear = function(){
  return redis.pipeline()
    .del(this.m.key)
    .del(this.m.last)
    .exec();
};

module.exports = CircularQueue;
