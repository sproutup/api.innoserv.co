'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  bookshelf = require('./bookshelf'),
  dynamoose = require('config/lib/dynamoose'),
  google = require('config/lib/google'),
  redis = require('./redis'),
  express = require('./express'),
  chalk = require('chalk'),
  core = require('modules/core/server/core.controller');

// Initialize Models
bookshelf.loadModels();

//SeedDB
if (config.seedDB) {
  require('./seed');
}

module.exports.loadModels = function loadModels() {
  bookshelf.loadModels();
  dynamoose.loadModels();
};

module.exports.init = function init(callback) {
  bookshelf.connect(function (db){
    console.log('bookshelf connected');
    var app = express.init(db);

    if(callback) callback(app, db, config);
  });

  google.connect(function() {
    console.log('google jwt connected');
  });
};

module.exports.start = function start(callback) {
  var _this = this;

  _this.init(function (app, db, config) {

    // Start the app by listening on <port>
    app.listen(config.port, function () {

      // Logging initialization
      console.log('--');
      console.log(chalk.green(config.app.title));
      console.log(chalk.green('Environment:\t\t\t' + process.env.NODE_ENV));
      console.log(chalk.green('Port:\t\t\t\t' + config.port));
      console.log(chalk.green('Database:\t\t\t' + config.db.uri));
      if (process.env.NODE_ENV === 'secure') {
        console.log(chalk.green('HTTPs:\t\t\t\ton'));
      }
      console.log('--');

      if (callback) callback(app, db, config);
    });

  });
};
