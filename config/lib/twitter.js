'use strict';

var Twit = require('twit'),
  config = require('config/config');

console.log('clientID', config.twitter.clientID);
console.log('clientSecret', config.twitter.clientSecret);
console.log('accessID', config.twitter.accessID);
console.log('accessSecret', config.twitter.accessSecret);

var T = new Twit({
  consumer_key:         config.twitter.clientID,
  consumer_secret:      config.twitter.clientSecret,
  access_token:         config.twitter.accessID,
  access_token_secret:  config.twitter.accessSecret
});

module.exports = T;
