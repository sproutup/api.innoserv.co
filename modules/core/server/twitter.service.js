'use strict';

var T = require('config/lib/twitter'),
    moment = require('moment'),
    redis = require('config/lib/redis'),
    /* global -Promise */
    Promise = require('bluebird'),
    CronJob = require('cron').CronJob,
    EventFact = require('modules/eventFact/server/eventFact.model');

var request = require('request-promise');
var OAuth = require('oauth');
var config = require('config/config');
Promise.promisifyAll(OAuth);

// statuses/show/631208737580019712
// statuses/retweets/631208737580019712
// https://api.twitter.com/1.1/users/show.json
// https://api.twitter.com/1.1/statuses/user_timeline.json

var TwitterService = function(){
  this.schema = {
    user: {
      id: null,
      followers_count: null,
      friends_count: null,
      statuses_count: null
    }
  };
};

/*
 * Init the twitter api quotas and setup intervals
 */
TwitterService.init = function(){
  console.log('twitter service init');

//  setInterval(LinkedAccount.process, moment.duration(1, 's').asMilliseconds());

//  Promise.join( 
//      TwitterService.quotaStatusesShowReset(), 
//      TwitterService.quotaStatusesRetweetsReset(),
//      function(statuses, retweets){
//        setInterval(TwitterService.quotaStatusesShowReset, moment.duration(1, 'm').asMilliseconds());
//        setInterval(TwitterService.quotaStatusesRetweetsReset, moment.duration(1, 'm').asMilliseconds());
//     }
//  );
};

/*
 * extraxt an event from a status received from twitter api
 */
TwitterService.extractEvent = function(status){
  var data = {
    counter : status.user.followers_count,
    date_dim_id : 260,
    user_id : 1,
    provider_dim_id : 3, // twitter:
    metrics_dim_id : 4 // followers 
  };

  return data;
};

TwitterService.extractEventFromRT = function(status){
  var data = {
    counter : status[0].user.followers_count,
    date_dim_id : 260,
    user_id : 1,
    provider_dim_id : 3, // twitter:
    metrics_dim_id : 4 // followers 
  };

  return data;
};

TwitterService.quotaStatusesShowDecr = function(){
  return redis.decr('quota:twitter:statuses:show');
};

TwitterService.quotaStatusesShowReset = function(){
  return redis.set('quota:twitter:statuses:show', 12);
};

TwitterService.quotaStatusesRetweetsDecr = function(){
  return redis.decr('quota:twitter:statuses:retweets');
};

TwitterService.quotaStatusesRetweetsReset = function(){
  return redis.set('quota:twitter:statuses:retweets', 4);
};

TwitterService.setFlag = function(id){
  return redis.sadd('analytics:tweet:flag', id);
};

TwitterService.getFlag = function(id){
  return redis.sismember('analytics:tweet:flag', id);
};

TwitterService.processStatus = function(item, type) {
  console.log('process status: ', type);
  return TwitterService.getFlag(type.id)
    .then(function(val){
      if(val===1){
          return val;
      }
      else{
        return TwitterService.quotaStatusesShowDecr()
          .then(function(val){
            console.log('statuses show quota: ', val);
            // ups we are out of quota
            if(val<1){
              console.log('-- suspend statuses show, quota used: ', val);
              return val;
            }
            else{
              return T.getAsync('statuses/show', { id: type.id })
               .then(function(data){
                 return data[0];
               })
               .then(TwitterService.extractEvent)
               .then(function(data){
                 data.content_id = item.id;
                 data.product_id = item.product_id;
                 data.user_id = item.user_id;
                 return data;
               })
               .then(EventFact.insert)
               .then(function(next){
                 return TwitterService.setFlag(type.id);
               });
            }
         });
      }
    });
};

TwitterService.cacheUser = function(user){
};

TwitterService.verifyCredentials = function(token,secret){
  console.log('verify credientials:', token);
  console.log('config:', config.twitter);
  var oauth = new OAuth.OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      config.twitter.clientID,
      config.twitter.clientSecret,
      '1.0A',
      null,
      'HMAC-SHA1'
    );
  return oauth.getAsync(
    'https://api.twitter.com/1.1/account/verify_credentials.json',
    token, //test user token
    secret).then(function (data, res){
      console.log(data[0]);
      return JSON.parse(data[0]);
    })
    .catch(function(err){
      console.log(err);
      return err;
    });
};

// https://api.twitter.com/1.1/users/show.json
TwitterService.showUser = function(id){
  return T.getAsync('users/show', { id: id })
  .then(function(data){
    var user = {
      id: id,
      followers: data[0].followers_count,
      friends: data[0].friends_count,
      statuses: data[0].statuses_count
    };
    console.log('updating twitter stats: ', user);
    redis.hmset('twitter:user:'+id, user);
    return data[0];
  })
  .catch(function(err){
    console.log('Error: ', err.statusCode);
    return {err: err};
  });
};

TwitterService.processRetweets = function(item, type){
  var _self = this;

  return TwitterService.quotaStatusesRetweetsDecr()
    .then(function(val){
      console.log('statuses retweets quota: ', val);
      // ups we are out of retweet quota
      if(val<1){
        console.log('-- suspend retweet, quota used: ', val);
        return val;
      }
      else{
        return T.getAsync('statuses/retweets', { id: type.id })
        .then(function(data){
          return data[0];
        })
        .map(function(status){
          return TwitterService.getFlag(status.id)
            .then(function(val){
              if(val===1){
                  return val;
              }
              else{
                console.log('content:', item);
                var data = TwitterService.extractEvent(status);
                data.content_id = item.id; 
                data.product_id = item.product_id;
                data.user_id = item.user_id;
                return EventFact.insert(data)
                  .then(function(next){
                    return TwitterService.setFlag(status.id);
                  });
              }
            });
        })
        .catch(function(err){
          console.log('twitter err: ' + err);
          return err;
        });
      }
    });
};

TwitterService.process = function(item, type){
  var self = this;
  console.log('twitter handler: ', type.id);
  return self.processStatus(item, type)
    .then(function(res){
        return self.processRetweets(item, type);
    });
/*
  T.get('statuses/show', { id: item.id }, function(err, data, response) {
      if(err) {
          console.log('twitter err: ' + err);
          return callback(err);
      }
     
      var item = new EventFact();
      item.data.counter = data.user.followers_count;
      item.data.date_dim_id = 260;
      item.data.user_id = 1;
      item.data.provider_dim_id = 3; // twitter:
      item.data.metrics_dim_id = 4; // followers
      item.insert();

      // todo add to redis
      // add viems to sorted set

      console.log('twitter success: ', data.user.followers_count);
      callback(null, data);
  });
  */
};

module.exports = TwitterService;
