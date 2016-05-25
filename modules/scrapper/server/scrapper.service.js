'use strict';

/**
 * Module dependencies.
 */
/* global -Promise */
var Promise = require('bluebird');
var rp = require('request-promise');
var extractor = require('unfluff');
var debug = require('debug')('up:debug:scrapper:service');

/**
 * Scrape html from a url and return unfluff'd data object 
 */
exports.getMeta = Promise.method(function(url) {
  var agent = 'Mozilla/5.0 (X11; U; Linux i686; en-US) AppleWebKit/534.3 (KHTML, like Gecko) Chrome/6.0.472.63 Safari/534.3';

  var options = {
    url: url,
    headers: {
      'User-Agent': agent
    }
  };

  return rp(options)
    .then(function(body) {
      var data = extractor.lazy(body);
      debug('title: ' + data.title());
      return data;
    })
    .catch(function(err) {
      console.log(err);
      return err;
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
