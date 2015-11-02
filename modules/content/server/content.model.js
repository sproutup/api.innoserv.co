'use strict';

var knex = require('config/lib/knex').knex,
  redis = require('config/lib/redis'),
  _ = require('lodash');

var Content = function() {
  this.data = {id: -1};
  this.type = {};
};

Content.prototype.get = function(id){
  console.log('get content', id);
};

Content.prototype.key = function(){
  var key = 'content:' + this.data.id;
  return key;
};

Content.key = function(id){
  var key = 'content:' + id;
  return key;
};

Content.prototype.getType = function(){
  var regTweet = /^https:\/\/twitter\.com\/(\w+)\/status\/(.+)$/;
  var regFacebookPost = /^https:\/\/www\.facebook\.com\/([^\/]+)\/posts\/(\d+)$/;
  var regYouTubeVideo = /^https:\/\/www\.youtube\.com\/watch\?v=([-\w]+)$/;
  var regUrl = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

  var res = {
    type: 'unknown',
    user: '',
    id: ''
  };

  if(_.isUndefined(this.data.url)){
    return res; 
  }

  if(regTweet.test(this.data.url)){
    res.type = 'tweet';
    res.user = regTweet.exec(this.data.url)[1]; 
    res.id = regTweet.exec(this.data.url)[2];
  }
  else if(regFacebookPost.test(this.data.url)){
    res.type = 'facebook';
    res.user = regFacebookPost.exec(this.data.url)[1]; 
    res.id = regFacebookPost.exec(this.data.url)[2];
  }
  else if(regYouTubeVideo.test(this.data.url)){
    res.type = 'youtube';
    res.id = regYouTubeVideo.exec(this.data.url)[1];
  }
  else if(regUrl.test(this.data.url)){
    res.type = 'url';
  }

  //console.log('type:', res);
  return res;
};


Content.prototype.update = function(){
  var _self = this;
  console.log('updating: ', _self.data.id);
  return knex('content')
    .where('id', _self.data.id)
    .update(_.pick(_self.data, ['url', 'updated_at']));
};

Content.prototype.insert = function(){
  var _self = this;
  return knex('content')
    .insert(_.omit(_self.data, ['id', 'timestamp', 'product_trial_id']));
};

Content.prototype.setCache = function(){
  var _self = this;
  return redis.hmset('content:' + this.data.id, _self.data)
    .then(function(result){
      return _self;
    });
};

Content.prototype.loadFromCache = function(id){
  var _self = this;
  return redis.hgetall('content:' + id)
    .then(function(result){
      //console.log('getCache:', result.id);
      _self.data = result;
      return _self;
    });
};

Content.prototype.checkCache = function(id){
  var _self = this;
  return redis.exists('content:' + id);
};

Content.prototype.loadFromDB = function(id){
  var _self = this;
  console.log('id: ', id);
  return knex('content')
    .leftOuterJoin('open_graph', 'content.open_graph_id', '=', 'open_graph.id')
    .where('content.id', id)
    .select('content.id as id', 'content.url as url', 'content.created_at as created_at', 'content.user_id as user_id', 'content.product_id as product_id', 'title', 'description', 'image', 'video')
    .first()
    .then(function(result){ 
      console.log('load from DB: ', result);
      _self.data = result;
      return _self;
    });
};

Content.findAll = function (callback){
  console.log('findAll()');
  return knex.select('*')
    .from('content')
    .nodeify(callback);
};

Content.findGreaterThan = function(id){
  console.log('find > ', id);
  return knex.select('id').from('content')
    .where('id', '>', id)
    .orderBy('id', 'asc')
    .limit(100)
    .then(function(rows) {
      return _.pluck(rows, 'id');
    });
};

Content.addToList = function(id){
  this.get(id).then(function(item){
    item.getType();
    var type = item.getType();
    redis.lpush('queue:content:' + type.type, id);
  });
};

/*
 * try to load from from cache otherwise load from DB
 * and then add to cache
 */
Content.get = function(id){
  var item = new Content();

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
          });
      }
    });
};

module.exports = Content;
