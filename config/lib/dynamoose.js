'use strict';

var dynamoose = require('dynamoose');
var config = require('../config');
var chalk = require('chalk');
var path = require('path');

console.log('--');
console.log(chalk.green('Dynamodb'));
console.log(chalk.green('Local:\t', config.dynamodb.local));

dynamoose.AWS.config.update({
  accessKeyId: 'AKID',
  secretAccessKey: 'SECRET',
  region: 'us-east-1'
});

// Load the models
dynamoose.loadModels = function (callback) {
  // Globbing model files
  config.files.server.models.forEach(function (modelPath) {
    require(path.resolve(modelPath));
  });

  if (callback) callback();
};

if(config.dynamodb.local === true){
  dynamoose.local();
}

module.exports = dynamoose;
