'use strict';

var dynamoose = require('dynamoose');
var config = require('../config');
var chalk = require('chalk');

console.log('--');
console.log(chalk.green('Dynamodb'));
console.log(chalk.green('Local:\t', config.db.local));
console.log(chalk.green('Region:\t', config.db.region));
console.log(chalk.green('Prefix:\t', config.db.prefix || process.env.NODE_ENV));
console.log(chalk.green('Create:\t', config.db.create));

dynamoose.AWS.config.update({
//  accessKeyId: 'AKID',
//  secretAccessKey: 'SECRET',
  region: config.db.region
});

dynamoose.defaults = {
  create: config.db.create,
  waitForActive: true, // Wait for table to be created
  waitForActiveTimeout: 180000, // 3 minutes
  prefix: config.db.prefix || process.env.NODE_ENV
}; // defaults

if(config.db.local === true){
  dynamoose.local();
}

// Load the mongoose models
module.exports.loadModels = function (callback) {
  // Globbing model files
  config.files.server.models.forEach(function (modelPath) {
    require(modelPath);
  });

  if (callback) callback();
};
