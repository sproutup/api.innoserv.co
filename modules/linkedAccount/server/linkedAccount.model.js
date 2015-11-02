'use strict';

var knex = require('config/lib/knex').knex,
  redis = require('config/lib/redis'),
  Promise = require('bluebird'),
  _ = require('lodash');

var LinkedAccount = function(data) {
  this.id = -1;
  this.schema = {
    id: null,
    user_id: null,
    provider_user_id: null,
    provider_key: null,
    provider_user_name: null,
    provider_user_image_url: null
  };
  this.data = this.sanitize(data);
};

LinkedAccount.prototype.sanitize = function (data) {
  data = data || {};
  return _.pick(_.defaults(data, this.schema), _.keys(this.schema));
};

LinkedAccount.prototype.get = function(id){
  console.log('get linked account', id);
};

LinkedAccount.prototype.key = function(){
  var key = 'linked:account:' + this.id;
  return key;
};

LinkedAccount.key = function(id){
  var key = 'linked:account:' + id;
  return key;
};

LinkedAccount.findGreaterThan = function(id){
  return knex.select('id').from('linked_account')
    .where('id', '>', id)
    .orderBy('id', 'asc')
    .limit(100)
    .then(function(rows) {
      if(_.isUndefined(rows)){
        return [];
      }
      else{
        return _.pluck(rows, 'id');
      }
    });
};

LinkedAccount.prototype.update = function(){
  var _self = this;
  console.log('updating: ', _self.data.id);
  this.data = this.sanitize(this.data);
//  return _.omit(_self.data, ['id']);
  return knex('linked_account')
    .where('id', _self.data.id)
    .update(_.omit(_self.data, ['id']))
    .then(function(){
      redis.del('user:'+_self.data.id);
      return _self.data;
    });
};

LinkedAccount.prototype.insert = function(){
  var _self = this;
  this.data = this.sanitize(this.data);
  return knex('linked_account')
    .insert(_.omit(_self.data, ['id']));
};

LinkedAccount.prototype.setCache = function(){
  var _self = this;
  return redis.hmset(this.key(), this.data)
    .then(function(result){
      return _self;
    });
};

LinkedAccount.prototype.loadFromCache = function(){
  var _self = this;
  return redis.hgetall(this.key())
    .then(function(result){
      _self.data = result;
      return _self;
    });
};

LinkedAccount.prototype.existsCache = function(){
  return redis.exists(this.key());
};

LinkedAccount.prototype.loadFromDB = function(id){
  var _self = this;
  console.log('id: ', id);
  return knex('linked_account')
    .where('id', id)
    .first()
    .then(function(result){ 
      console.log('load from DB: ', result);
      _self.data = result;
      return _self;
    });
};

LinkedAccount.findAllTwitterAccounts = function (){
  console.log('findAllTwitterAccounts()');
  return knex.select('*')
    .from('linked_account')
    .where('provider_key', 'twitter');
};

LinkedAccount.forge = function(id){
  return new Promise(function(resolve){
    var item = new LinkedAccount();
    item.id = id;
    resolve(item);
  });
};

/**
 * Add all content to the queue
 */
LinkedAccount.next = function () {
  var _self = this;
  redis.lpop('queue:linked:account').then(function(item){
    if(_.isUndefined(item)){
      console.log('not found');
      return item;
    }
    console.log('found: ', item);
    redis.rpush('queue:linked:account', item);
    return LinkedAccount.get(item);
  })
  .catch(function (err) {
  });
};

/*
 * try to load from from cache otherwise load from DB
 * and then add to cache
 */
LinkedAccount.get = function(id){
  var item = new LinkedAccount();
  item.id = id;
  return item.existsCache(id)
    .then(function(result){
      if(result===1){
        // load from cache
        return item.loadFromCache(id);
      }
      // load from db
      return item.loadFromDB(id)
        .then(function(result){
          // add to cache
          return item.setCache();
        })
        .then(function(result){
          return item;
        });
    });
};

module.exports = LinkedAccount;
