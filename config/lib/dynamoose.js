'use strict';

var dynamoose = require('dynamoose');
var Promise = require('bluebird');
var config = require('../config');
var chalk = require('chalk');
const https = require('https');

console.log('--');
console.log(chalk.green('Dynamodb'));
console.log(chalk.green('Local:\t', config.db.local));
console.log(chalk.green('Region:\t', config.db.region));
console.log(chalk.green('Prefix:\t', config.db.prefix || process.env.NODE_ENV));
console.log(chalk.green('Create:\t', config.db.create));

dynamoose.defaults = {
  create: config.db.create,
  waitForActive: true, // Wait for table to be created
  waitForActiveTimeout: 180000, // 3 minutes
  prefix: config.db.prefix || process.env.NODE_ENV
}; // defaults

if(config.db.local === true){

  dynamoose.AWS.config.update({
    region: config.db.region
  });

  dynamoose.local();
}
else {
  dynamoose.AWS.config.update({
    region: config.db.region,
    httpOptions: {
      agent: new https.Agent({
        secureProtocol: 'TLSv1_method',
        ciphers: 'ALL'
      })
    }
  });
}

// Load the mongoose models
module.exports.loadModels = Promise.method(function () {
  console.log('loadModels');
  return Promise.each(config.files.server.models, function(path){
    console.log('model: ', path);
    require(path);
    return path;
  });

 // Globbing model files
//  config.files.server.models.forEach(function (modelPath) {
//    require(modelPath);
//  });

});
