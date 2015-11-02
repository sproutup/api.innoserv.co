'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
    flyway = require('./flyway'),
  chalk = require('chalk'),
  path = require('path');


console.log('--');
console.log(chalk.green('Knex'));
console.log(chalk.green('Host:\t', config.knex.connection.host));
console.log(chalk.green('Database:\t', config.knex.connection.database));

var knex = require('knex')(config.knex);

module.exports.knex = knex;

// Load the models
module.exports.loadModels = function () {
  // Globbing model files
  console.log('models: ');
  config.files.server.models.forEach(function (modelPath) {
    console.log(modelPath);
    require(path.resolve(modelPath));//(bookshelf);
  });
};

// Initialize Knex
module.exports.connect = function (cb) {
  var _this = this;
  console.log('init knex');
  if(config.flyway){
    flyway.migrate(function(err, data){
      if(err) cb(err);
      cb(err);
    });
  }
  else{
    cb(null);
  }
};

module.exports.disconnect = function (cb) {
//  mongoose.disconnect(function (err) {
//    console.info(chalk.yellow('Disconnected from MongoDB.'));
//    cb(err);
//  });
  cb(null);
};
