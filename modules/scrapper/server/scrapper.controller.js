'use strict';

/**
 * Module dependencies.
 */
var scrapper = require('./scrapper.service');
var debug = require('debug')('up:debug:scrapper:ctrl');

/**
 * Show the company
 */
exports.getMeta = function (req, res) {
  scrapper.getMeta(req.body.url).then(function(val) {
    if (val) {
      res.json({
        title: val.title(),
        author: val.author(),
        publisher: val.publisher(),
        description: val.description(),
        image: val.image(),
        date: val.date()
      });
    } else {
      res.status(302).send('No meta data found.');
    }
  });
};
