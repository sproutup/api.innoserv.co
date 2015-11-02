'use strict';

/**
 * Module dependencies.
 */
//var articlesPolicy = require('../policies/articles.server.policy');
var content = require('./content.controller');


module.exports = function (app) {

//  app.use(require('express-promise')());

  // Articles collection routes
  app.route('/api/content') //.all(articlesPolicy.isAllowed)
    .get(content.list);

  app.route('/api/content/next') //.all(articlesPolicy.isAllowed)
    .get(function(req, res){
      res.json({value: content.next(req, res)});
    });

  app.route('/api/content/init') //.all(articlesPolicy.isAllowed)
    .get(content.init);

  // Single content routes
  app.route('/api/content/:contentId')//.all(articlesPolicy.isAllowed)
    .get(content.read);

  // Finish by binding the content middleware
  app.param('contentId', content.contentByID);
};
