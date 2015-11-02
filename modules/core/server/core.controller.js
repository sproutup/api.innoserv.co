'use strict';

var config = require('config/config'),
    moment = require('moment'),
  redis = require('config/lib/redis'),
  content = require('modules/content/server/content.controller'),
  linkedAccount = require('modules/linkedAccount/server/linkedAccount.model'),
  Content = require('modules/content/server/content.model'),
  YoutubeAnalyticsService = require('./youtubeanalytics.service'),
  twitter = require('./twitter.service');

// Return url type
function getUrlType(item, callback) {
  var regTweet = /^https:\/\/twitter\.com\/(\w+)\/status\/(.+)$/;
  var regFacebookPost = /^https:\/\/www\.facebook\.com\/([^\/]+)\/posts\/(\d+)$/;
  var regYouTubeVideo = /^https:\/\/www\.youtube\.com\/watch\?v=([-\w]+)$/;
  var regUrl = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

  //var self = this;
  var type = 'unknown';

  if(regTweet.test(item.url)){
    type = 'tweet';
    item.status_id = regTweet.exec(item.url)[2];
    twitter.process(item, callback);
  }
  else if(regFacebookPost.test(item.url)){
    type = 'facebook';
  }
  else if(regYouTubeVideo.test(item.url)){
    type = 'youtube';
    YoutubeAnalyticsService.process(item);
  }
  else if(regUrl.test(item.url)){
    type = 'url';
  }
  console.log('type:', type);
  callback(null, type);
}

/**
 * Process 
 */
exports.process = function () {
  return redis.llen('queue:content').then(function(val){
    if(val===0){
      return val;
    }
    else{
      redis.lpop('queue:content').then(function(id){
        redis.rpush('queue:content', id);
        Content.get(id).then(function(result){
          console.log(result.getType());
          getUrlType(result, function(err, data){
          });
        });
      });   
    }
  })
  .catch(function (err) {
  });
};

exports.processLinkedAccounts = function(){
  console.log('linked accounts');
  twitter.showUser('1140961536').then(function(res){
    console.log('res: ', res.id);
  })
//  .then(linkedAccount.next)
  .then(function(res){
    console.log('l:',res);
  });
};

/**
 * Check if there is new content
 */
exports.updateContentList = function() {
  content.update().then(function(result){
  });
};

/**
 * Render the main application page
 */
exports.renderIndex = function (req, res) {
  res.render('modules/core/server/views/index', {
    user: req.user || null
  });
};

/**
 * Render the server error page
 */
exports.renderServerError = function (req, res) {
  res.status(500).render('modules/core/server/views/500', {
    error: 'Oops! Something went wrong...'
  });
};

/**
 * Render the server not found responses
 * Performs content-negotiation on the Accept HTTP header
 */
exports.renderNotFound = function (req, res) {

  res.status(404).format({
    'text/html': function () {
      res.render('modules/core/server/views/404', {
        url: req.originalUrl
      });
    },
    'application/json': function () {
      res.json({
        error: 'Path not found'
      });
    },
    'default': function () {
      res.send('Path not found');
    }
  });
};
