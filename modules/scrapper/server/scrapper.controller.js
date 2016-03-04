'use strict';

/**
 * Module dependencies.
 */
var scrapper = require('./scrapper.service');

/**
 * Show the company
 */
exports.getMeta = function (req, res) {
  scrapper.getMeta(req.body.url).then(function(val) {
    res.json({
      title: val.title(),
      author: val.author(),
      publisher: val.publisher(),
      description: val.description(),
      image: val.image(),
      date: val.date()
    });
  });
};
