'use strict';

/**
 * Module dependencies.
 */
var Promise = require('bluebird');
var dynamoose = require('dynamoose');
var knex = require('config/lib/bookshelf').knex;
var User = dynamoose.model('User');
var Provider = dynamoose.model('Provider');
var Slug = dynamoose.model('Slug');
var scrapper = require('modules/scrapper/server/scrapper.service');
var _ = require('lodash');
var moment = require('moment');
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');

/**
 * Show the company
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * List of Users
 */
exports.list = function (req, res) {
  Promise.join(
      addSnowflakeToAllUsers(),
      addSnowflakeToAllPosts(),
      migratePassword(),
      migrateUser(),
      migrateSlug(),
      migratePost()
    ).then(function(items){
    res.json(items);
  });
};

var addSnowflakeToAllUsers = Promise.method(function(){
  return knex.select('*').from('users').whereNull('external_type').map(function(row) {
    console.log('adding snowflake to user: ', row.id);
    return knex('users').where({id: row.id}).update({external_type: intformat(flakeIdGen.next(), 'dec')});
  });
});

var addSnowflakeToAllPosts = Promise.method(function(){
  return knex.select('*').from('post').whereNull('title').map(function(row) {
    console.log('adding snowflake to post: ', row.id);
    return knex('post').where({id: row.id}).update({title: intformat(flakeIdGen.next(), 'dec')});
  });
});

var migratePassword = Promise.method(function(){
  return knex.from('users')
    .join('linked_account', 'users.id', 'linked_account.user_id')
    .whereNotNull('external_type').whereNotNull('email').map(function(row) {
      console.log('migrating password: ', row.email);
      var provider = {
        id: row.email.toLowerCase().trim(),
        provider: 'password',
        userId: row.external_type,
        data: {
          hash: row.provider_user_id,
          migrate_user_id: row.user_id,
          migrate_date: moment().valueOf()
        }
      };
      return Provider.create(provider).then(function(val){
        console.log('password migrate success: ', val.id);
        return val;
      }).catch(function(err){
        console.log('## password not migrated ## ', provider.id);
        return {email: provider.id, status: 'password not migrated'};
      });
  });
});

var migrateUser = Promise.method(function(){
  return knex.from('users')
    .where({active: 1})
    .whereNotNull('external_type')
    .map(function(row) {
      console.log('migrating user: ', row.email);
      var user = {
        id: row.external_type,
        username: row.nickname,
        displayName: row.name,
        description: row.description,
        address: row.street_address1,
        phone: row.phone_numbner,
        email: row.email
      };
//      return user;
      return User.create(user).then(function(val){
        console.log('user migrate success: ', val.email);
        return val;
      }).catch(function(err){
        console.log('## user not migrated ## ', user.email);
        return {email: user.email, status: 'user not migrated'};
      });
  });
});

var migrateSlug = Promise.method(function(){
  return knex.from('users')
    .where({active: 1})
    .whereNotNull('external_type')
    .whereNotNull('nickname')
    .map(function(row) {
      console.log('migrating user slug: ', row.username);
      var slug = {
        id: row.nickname,
        orig: row.nickname,
        refId: row.external_type,
        refType: 'User'
      };
//      return slug;
      return Slug.create(slug).then(function(val){
        console.log('slug migrate success: ', val.id);
        return val;
      }).catch(function(err){
        console.log('## slug not migrated ## ', slug.id);
        return {slug: slug.id, status: 'slug not migrated', err: err};
      });
  });
});

var migratePost = Promise.method(function(){
  return knex.select([
      'post.*',
      'post.title as id',
      'post.body as body',
      'users.external_type as userId',
      'content.url as url'])
    .from('post')
    .innerJoin('users', 'post.user_id', 'users.id')
    .leftJoin('content', 'post.content_id', 'content.id')
    .where({active: 1})
    .whereNotNull('title')
    .options({ nestTables: true, rowMode: 'array' })
    .map(function(row) {
      console.log('migrating post: ', row);
      if(row.content.url){
        console.log('get meta ', row.content.url);
        return scrapper.getMeta(row.content.url).then(function(val){
          console.log('got meta ', row.content.url);
          var meta;
          if(val){
            meta = {
              title: val.title(),
              author: val.author(),
              publisher: val.publisher(),
              description: val.description(),
              image: val.image(),
              date: val.date()
            };
          }

          var post = {
            id: row.post.id,
            created: moment(row.post.created_at).utc().unix(),
            userId: row.users.userId,
            body: row.post.body,
            meta: meta
          };
          return post;
        });
      }
      else{
        var post = {
          id: row.post.id,
          created: moment(row.post.created_at).utc().unix(),
          userId: row.users.userId,
          body: row.post.body
        };
        return post;
      }
////      return user;
//      return User.create(user).then(function(val){
//        console.log('user migrate success: ', val.email);
//        return val;
//      }).catch(function(err){
//        console.log('## user not migrated ## ', user.email);
//        return {email: user.email, status: 'user not migrated'};
//      });
  });
});


/**
 * upgrade
 */
exports.upgrade = function (req, res) {
  Promise.join(
    upgradeV1_01()
  ).then(function(items){
    res.json(items);
  });
};

var upgradeV1_01 = Promise.method(function(){
  return Provider.scan().exec().then(function(items){
    console.log('v1.01 - ', items.length);
    var time = moment().subtract(1,'day').utc().startOf('day').unix();
    return Promise.each(items, function(o){
      console.log('item - ', o.id, o.timestamp);
      return Provider.update({id: o.id, provider: o.provider}, {status: 1, timestamp: time});
    });
  })
  .catch(function(err){
    return err;
  });
});

