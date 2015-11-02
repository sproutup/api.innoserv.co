'use strict';

/**
 * Module dependencies.
 */
var knex = require('config/lib/knex').knex,
  twitterService = require('modules/core/server/twitter.service'),
  config = require('config/config'),
  redis = require('config/lib/redis'),
  _ = require('lodash'),
  youtubeanalytics = require('modules/core/server/youtubeanalytics.service'),
  errorHandler = require('modules/core/server/errors.controller');

//var Promise = require('bluebird');
var LinkedAccount = require('./linkedAccount.model');
var Queue = require('modules/core/server/circularQueue');

var LinkedAccountController = function(){

};

/**
 * Add all content to the queue
 */
LinkedAccountController.init = function (req, res) {
  var q = new Queue('queue:linked:account');
  return q.clear()
    .then(function(){
      return q.last();
    })
    .then(LinkedAccount.findGreaterThan)
    .then(function(val){
      if(val.length>0){
        return q.add(val);
      }
    })
    .then(function(result){
      console.log(result);
      res.json({res: result});
    });

  //  Contents.forge()
//    .fetch()
//    .then(function (collection) {
//      redis.del('queue:content');
//      collection.each(function(item){
//        redis.del('content:'+item.get('id'));
//        redis.hmset('content:'+item.get('id'), 'url', item.get('url'));
//        redis.lpush('queue:content', item.get('id'));
//      });
//      res.json({error: false, data: collection.toJSON()});
//    })
//    .catch(function (err) {
//      return res.status(400).send({
//        message: errorHandler.getErrorMessage(err)
//      });
//  });
};



/**
 * Show the current content item
 */
LinkedAccountController.read = function (req, res) {
  res.json(req.content);
};


/**
 * List of Linked Accounts
 */
LinkedAccountController.list = function (req, res) {
  LinkedAccount.findAllTwitterAccounts()
    .then(function(data){
      res.json({error: false, data: data});
    })
    .catch(function(err){
       return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    });
};


/**
 * Add new items to the queue
 */
exports.addLatest = function (latest_id) {
  var _self = this;

  return knex.select('id').from('linked_account')
    .where('id', '>', latest_id)
    .orderBy('id', 'asc')
    .limit(10)
    .then(function(rows) {
      return _.pluck(rows, 'id');
    })
    .then(function(array){
      if(array.length > 0){
        console.log('found new linked account: ', array);
        redis.lpush('queue:linked:account', array);
        // last element
        return array[array.length - 1];
      }
      else{
        return -1;
      }
    })
    .then(function(res){
      if(res > 0){
        var key = 'queue:linked:account:latest';
        redis.set(key, res);
        return res;
      }
      else{
        return -1;
      }
    })
    .catch(function(err){
      // todo
    });
};

/**
 * Update queue
 */
LinkedAccountController.update = function(){
  var q = new Queue('queue:linked:account');
  return q.last()
    .then(LinkedAccount.findGreaterThan)
    .then(function(val){
      if(val.length>0){
        console.log('update: ', val);
        return q.add(val);
      }
      return val;
    })
    .then(function(result){
      return result;
    });
};

/*
 * Add item id to queue based on provider key
 */
LinkedAccountController.addToQueue = function(account){
  switch(account.data.provider_key){
    case 'twitter':
      return Queue.add('queue:linked:account:twitter', account.data.id);
    default:
      return;
  }
};


/**
 * Next
 */
LinkedAccountController.next = function (req, res) {
  var _self = this;
  var key = 'queue:linked:account';
  var q = new Queue(key);

  return q.next()
    .then(function(item){
      if(_.isUndefined(item)){
        console.log('undefined');
        return 'empty list';
      }
      console.log('queue:linked:account -> ', item);
      return LinkedAccount.get(item)
      .then(function(account){
        console.log('account:', account.data.provider_user_id);
        if(account.data.provider_key === 'twitter'){
          console.log('id:', account.data.provider_user_id);
          return twitterService.showUser(account.data.provider_user_id)
            .then(function(user){
              console.log('updating ' + user.id_str + '===' + account.data.provider_user_id);
              if(user.id_str === account.data.provider_user_id){
                if(account.data.provider_user_name !== user.screen_name ||
                account.data.provider_user_image_url !== user.profile_image_url_https){
                  account.data.provider_user_name = user.screen_name;
                  account.data.provider_user_image_url = user.profile_image_url_https;
                  //return account.setCache();
                  return account.update()
                    .then(function(result){
                      redis.del('user:'+user.id);
                      return result;
                    });
                }
                else{
                  return 'no change detected';
                }
              }
              return 'no op';
            });
        }
        return {};
      })
      .then(function(result){
        console.log('update result ', result);
        res.json(result);
      });
    })
    .catch(console.log.bind(console));
};


/**
 * Add all content to the queue
 */
LinkedAccountController.process = function () {
  var _self = this;
  var key = 'queue:linked:account';
  var q = new Queue(key);

  return q.next()
    .then(function(item){
      if(_.isUndefined(item)){
        console.log('empty list');
        return 'empty list';
      }
      console.log('queue:linked:account -> ', item);
      return LinkedAccount.get(item)
      .then(LinkedAccountController.refresh);
    });
};

/*
 * Refresh the account object using GET users/show to make sure we are using 
 * the most recent profile_image_url or profile_image_url_https. The URL may have 
 * changed, which happens for instance when the user updates their profile image.
 */
LinkedAccountController.refresh = function(account){
  if(account.data.provider_key === 'twitter'){
    return twitterService.showUser(account.data.provider_user_id)
      .then(function(user){
        if(user.id_str === account.data.provider_user_id){
          if(account.data.provider_user_name !== user.screen_name ||
          account.data.provider_user_image_url !== user.profile_image_url_https){
            account.data.provider_user_name = user.screen_name;
            account.data.provider_user_image_url = user.profile_image_url_https;
            //return account.setCache();
            return account.update()
              .then(function(){
                return account.setCache();
              })
              .then(function(result){
                redis.del('user:'+user.id);
                return result;
              });
          }
          else{
            console.log('no change');
            return 'no change detected';
          }
        }
        return 'no op';
      });
  }
  return {};

};

/**
 * Content middleware
 */
LinkedAccountController.linkedAccountByID = function (req, res, next, id) {
  LinkedAccount.get(id).then(function(result){
    req.content = result;
    next();
  });

//  if (!mongoose.Types.ObjectId.isValid(id)) {
//    return res.status(400).send({
//      message: 'Article is invalid'
//    });
//  }
//
//  Article.findById(id).populate('user', 'displayName').exec(function (err, article) {
//    if (err) {
//      return next(err);
//    } else if (!article) {
//      return res.status(404).send({
//        message: 'No article with that identifier has been found'
//      });
//    }
//    req.article = article;
//    next();
//  });
};

module.exports = LinkedAccountController;
