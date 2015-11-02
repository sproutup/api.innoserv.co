'use strict';

var knex = require('config/lib/knex').knex,
  bookshelf = require('config/lib/bookshelf').bookshelf,
  _ = require('lodash'),
  redis = require('config/lib/redis');

var EventFact = function() {
  this.data = {id: -1};
};

EventFact.prototype.get = function(id){
  console.log('get content', id);
};

EventFact.prototype.key = function(){
  var key = 'content:' + this.data.id;
  return key;
};

EventFact.key = function(id){
  var key = 'eventFact:' + id;
  return key;
};

EventFact.prototype.setCache = function(){
  var _self = this;
  return redis.incrby('analytics:content:' + this.data.content_id + ':views', _self.data.counter);
};

EventFact.prototype.loadFromCache = function(id){
  var _self = this;
  return redis.hgetall('content:' + id)
    .then(function(result){
      console.log('getCache:', result);
      _self.data = result;
      return result;
    });
};

EventFact.prototype.checkCache = function(id){
  var _self = this;
  return redis.exists('content:' + id);
};

EventFact.prototype.loadFromDB = function(id){
  var _self = this;
  return knex('content')
    .where('id', id)
    .first()
    .then(function(result){ 
      console.log('load from DB: ', result);
      _self.data = result;
      return _self;
    });
};

EventFact.prototype.insert = function(status){
  var _self = this;
  console.log('this', this);
  console.log('insert:', status[0].user);

  _self.data = {
    counter : status[0].user.followers_count,
    date_dim_id : 260,
    user_id : 1,
    provider_dim_id : 3, // twitter:
    metrics_dim_id : 4 // followers 
  };

  return knex('event_fact')
    .insert(_.omit(_self.data, ['id']))
    .then(_self.setCache)
    .then(function(result){ 
      console.log('saved:', _self.content_id);
      _self.data.id = result[0];
      return _self.data.id;
    })
    .catch(function(err){
      console.log('event fact err: ' + err);
      return err;
    });
};

EventFact.findAll = function (callback){
  console.log('findAll()');
  return knex.select('*')
    .from('content')
    .nodeify(callback);
};

EventFact.insert = function(data){

  var item = new EventFact();

  item.data = data;

  return knex('event_fact')
    .insert(_.omit(item.data, ['id']))
    .then(function(res){
      item.setCache();
      return res;
    })
    .then(function(result){ 
      console.log('saved:', result);
      item.data.id = result[0];
      return item;
    })
    .catch(function(err){
      console.log('event fact err: ' + err);
      return err;
    });
};


/*
 * try to load from from cache otherwise load from DB
 * and then add to cache
 */
EventFact.get = function(id){
  var item = new EventFact();

  return item.checkCache(id)
    .then(function(result){
      if(result===1){
        // load from cache
        return item.loadFromCache(id);
      }
      else{
        // load from db
        return item.loadFromDB(id)
          .then(function(result){
            // add to cache
            return item.setCache();
          })
          .then(function(result){
            return item.data;
          });
      }
    });
};

module.exports = EventFact;
