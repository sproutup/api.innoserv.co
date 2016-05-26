'use strict';

/**
 * Module dependencies.
 */
var Promise = require('bluebird');
var redis = require('config/lib/redis');
var dynamoose = require('dynamoose');
var knex = require('config/lib/bookshelf').knex;
var User = dynamoose.model('User');
var Provider = dynamoose.model('Provider');
var Slug = dynamoose.model('Slug');
var Post = dynamoose.model('Post');
var oauthModel = dynamoose.model('oauth');
var CommentModel = dynamoose.model('Comment');
var scrapper = require('modules/scrapper/server/scrapper.service');
var twitter = require('modules/service/server/twitter.service');
var facebook = require('modules/service/server/facebook.service');
var googleplus = require('modules/service/server/googleplus.service');
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
  redis.flushall();
  addSnowflakeToAllUsers().then(function(){
   return migratePassword();
  }).then(function(){
    return migrateLinkedAccount();
  }).then(function(){
    return migrateTwitter();
  }).then(function(){
    return migrateFacebook();
  }).then(function(){
    return migrateGoogle();
  }).then(function(){
    return migrateUser();
  }).then(function(){
    return migrateSlug();
  }).then(function(){
    res.json('ok');
  });
};

exports.post = function (req, res) {
  redis.flushall();
  addFlakeFieldToComment().then(function(){
    return addSnowflakeToAllPosts();
  }).then(function(){
    return migrateComment();
  }).then(function(){
    return migratePost();
  }).then(function(){
    res.json('ok');
  });
};

exports.flake = function (req, res) {
  redis.flushall();
  addSnowflakeToAllUsers().then(function(){
    res.json('ok');
  });
};

exports.linked = function (req, res) {
  redis.flushall();
  return migrateLinkedAccount().then(function(){
    res.json('ok');
  });
};

exports.password = function (req, res) {
  redis.flushall();
  return migratePassword().then(function(){
    res.json('ok');
  });
};

exports.user = function (req, res) {
  redis.flushall();
  return migrateUser().then(function(){
    res.json('ok');
  });
};

exports.slug = function (req, res) {
  redis.flushall();
  return migrateSlug().then(function(){
    res.json('ok');
  });
};

var addFlakeFieldToComment = Promise.method(function(){
  return knex.raw('ALTER TABLE comment ADD flake VARCHAR(20)').then(function(){
    console.log('comment altered added migrate column');
    return true;
  }).catch(function(err){
    console.log('comment migrate column exists');
    return false;
  });
});

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

var addSnowflakeToAllComments = Promise.method(function(){
  return knex.select('*').from('comment').whereNull('flake').map(function(row) {
    console.log('adding snowflake to comment: ', row.id);
    return knex('comment').where({id: row.id}).update({flake: intformat(flakeIdGen.next(), 'dec')});
  });
});

function sleep(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

var migratePassword = Promise.method(function(){
  return knex.from('users')
    .join('linked_account', 'users.id', 'linked_account.user_id')
    .whereNotNull('external_type').whereNotNull('email')
    .map(function(row) {
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

      return sleep(200).then(function(){
        return Provider.create(provider);
      }).then(function(val){
        console.log('password migrate success: ', val.id);
        return val;
      }).catch(function(err){
        console.log('## password not migrated ## ', provider.id);
        return {email: provider.id, status: 'password not migrated'};
      });
    });
});

var migrateLinkedAccount = Promise.method(function(){
  return knex.from('users')
    .join('linked_account', 'users.id', 'linked_account.user_id')
    .whereNotNull('external_type')
    .where('linked_account.provider_key', 'twitter')
    .orWhere('linked_account.provider_key', 'facebook')
    .options({ nestTables: true, rowMode: 'array' })
    .map(function(row) {
      console.log('migrating LinkedAccount: ', row.linked_account.provider_key);
      var provider = {
        userId: row.users.external_type,
        status: -1
      };

      return sleep(200).then(function(){
        return Provider.update({id: row.linked_account.provider_user_id, 
        provider: row.linked_account.provider_key}, provider);
      }).then(function(val){
        console.log('linked account migrate success: ', val.id);
        return val;
      }).catch(function(err){
        console.log('## linked account not migrated ## ', provider.id);
        return null;
      });
  });
});

var migrateTwitter = Promise.method(function(){
  return knex.from('users')
    .whereNotNull('external_type').map(function(row) {
      console.log('migrating twitter: ', row.id);
      return oauthModel.getAccessToken(row.id, 'tw').then(function(val){
        if(!val) return null;
        return twitter.verifyCredentials(val.accessToken, val.accessSecret).then(function(info){
          if(!info) return null;
          console.log('twitter: ', info.id);
          var time = moment().subtract(1,'day').utc().startOf('day').unix();
          var provider = new Provider({
            id: info.id,
            provider: 'twitter',
            userId: row.external_type,
            data: {
              token: val.accessToken,
              tokenSecret: val.accessSecret
            },
            status: 1,
            timestamp: time
          });

          // And save the provider
          return sleep(200).then(function(){
            return provider.save().then(function(res){
              console.log('new provider: ', res.id);
              return res;
            });
          });
        });
      });
  });
});

var migrateFacebook = Promise.method(function(){
  return knex.from('users')
    .whereNotNull('external_type').map(function(row) {
      return oauthModel.getAccessToken(row.id, 'fb').then(function(val){
        if(!val) return null;
        console.log('facebook: ', val.userId);
        return facebook.showUser('me', val.accessToken).then(function(info){
          if(!info) return null;
          console.log('facebook: ', info.id);
          var time = moment().subtract(1,'day').utc().startOf('day').unix();
          var provider = new Provider({
            id: info.id,
            provider: 'facebook',
            userId: row.external_type,
            data: {
              accessToken: val.accessToken
            },
            status: 1,
            timestamp: time
          });

          // And save the provider
          return sleep(200).then(function(){
            return provider.save().then(function(res){
              console.log('new provider: ', res.id);
              return res;
            });
          });
        }).catch(function(err){
          console.log('facebook err: ', err.message);
          return null;
        });
      });
  });
});

var migrateGoogle = Promise.method(function(){
  return knex.from('users')
    .whereNotNull('external_type').map(function(row) {
      return oauthModel.getAccessToken(row.id, 'google').then(function(val){
        if(!val) return null;
        console.log('google: ', val.userId);
        return googleplus.showUser('me', val.accessToken).then(function(info){
          if(!info) return null;
          console.log('google: ', info.id);
          var time = moment().subtract(1,'day').utc().startOf('day').unix();
          var provider = new Provider({
            id: info.id,
            provider: 'google',
            userId: row.external_type,
            data: {
              accessToken: val.accessToken,
              refreshToken: val.refreshToken,
              expires: val.expires
            },
            status: 1,
            timestamp: time
          });

          // And save the provider
          return sleep(200).then(function(){
            return provider.save().then(function(res){
              console.log('new google provider: ', res.id);
              return res;
            });
          });
        });
      }).catch(function(err){
        console.log('google err: ', err.message);
        return null;
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
      return sleep(200).then(function(){
        return User.create(user).then(function(val){
          console.log('user migrate success: ', val.email);
          return val;
        }).catch(function(err){
          console.log('## user not migrated ## ', user.email);
          return {email: user.email, status: 'user not migrated'};
        });
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
      return sleep(200).then(function(){
        return Slug.create(slug).then(function(val){
          console.log('slug migrate success: ', val.id);
          return val;
        }).catch(function(err){
          console.log('## slug not migrated ## ', slug.id);
          return {slug: slug.id, status: 'slug not migrated', err: err};
        });
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
      console.log('migrating post: ', row.post.id);
      return Promise.try(function(){
        console.log('date: ', moment(row.post.created_at).format());
        if(row.content.url){
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
              created: moment(row.post.created_at).utc(),
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
            created: moment(row.post.created_at).utc(),
            userId: row.users.userId,
            body: row.post.body
          };
          return post;
        }
      }).then(function(o){
        var post = new Post(o);
        return sleep(200).then(function(){
          return post.save(o).then(function(val){
            console.log('post migrate success: ', val.id);
            return val;
          }).catch(function(err){
            console.log('## post not migrated ## ', o.id);
            return {id: o.id, status: 'post not migrated'};
          });
        });
      });
  });
});

var migrateComment = Promise.method(function(){
  return knex.select([
      'comment.*',
      'comment.flake as id',
      'comment.body as body',
      'post.title as id',
      'users.external_type as userId'])
    .from('comment')
//    .debug(true)
    .innerJoin('post', 'comment.ref_id', 'post.id')
    .innerJoin('users', 'comment.user_id', 'users.id')
    .where({ref_type: 'models.post'})
    .whereNotNull('comment.ref_id')
    .options({ nestTables: true, rowMode: 'array' })
    .map(function(row) {
      console.log('migrating comment: ', row);
      var comment = new CommentModel({
        id: row.comment.id,
        created: moment(row.comment.created_at).utc(),
        userId: row.users.userId,
        body: row.comment.body,
        refId: row.post.id,
        refType: 'Post'
      });
      return sleep(200).then(function(){
        return comment.save().then(function(val){
          console.log('comment migrate success: ', val.id);
          return val;
        }).catch(function(err){
          console.log('## comment not migrated ## ', comment.id);
          return {id: comment.id, status: 'comment not migrated'};
        });
      });
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

