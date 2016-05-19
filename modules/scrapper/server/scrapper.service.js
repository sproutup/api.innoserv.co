'use strict';

/**
 * Module dependencies.
 */
/* global -Promise */
var Promise = require('bluebird');
var rp = require('request-promise');
var extractor = require('unfluff');

/**
 * Scrape html from a url and return unfluff'd data object 
 */
exports.getMeta = Promise.method(function(url) {
  return rp(url)
    .then(function(body) {
      var data = extractor.lazy(body);
      console.log('title: ' + data.title());
      return data;
    })
    .catch(function(err) {
      return null;
    });

    // You can take the returned data object to access whichever data elements you need directly.
    // console.log(data.title());
    // console.log(data.date());
    // console.log(data.author());
    // console.log(data.text());
    // console.log(data.image());
    // console.log(data.tags());
    // console.log(data.videos());
    // ...
});
