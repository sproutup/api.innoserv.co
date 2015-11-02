'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  dynamoose = require('./dynamoose'),
  express = require('./express'),
  chalk = require('chalk');

// Initialize Models
dynamoose.loadModels();

var Promise = require('bluebird');

process.on('uncaughtException', function (err) {
  console.error('An uncaught error occurred!');
  console.error(err.stack);
});

//SeedDB
if (config.seedDB) {
  require('./seed');
}

module.exports.loadModels = function loadModels() {
  dynamoose.loadModels();
};

module.exports.init = function init(callback) {
    var app = express.init(dynamoose);
    if(callback) callback(app, dynamoose, config);

//  mongoose.connect(function (db) {
//      // Initialize express
//      var app = express.init(db);
//      if (callback) callback(app, db, config);      
//    });
// });
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
