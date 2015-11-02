'use strict';

var config = require('config/config'),
  chalk = require('chalk'),
  google = require('googleapis'),
  /* global -Promise */
  Promise = require('bluebird');


console.log('--');
console.log(chalk.green('Google API'));
console.log(chalk.green('clientID:\t', config.google.clientID));
console.log(chalk.green('callbackURL:\t', config.google.callbackURL));
// Prod
//var CLIENT_ID = "200067319298-cpblm10r8s9o29kjgtahjek2eib7eigk.apps.googleusercontent.com";
//var CLIENT_SECRET = "nQ4NK9cKoPl8fWXDF9V-PsTU";
//var REDIRECT_URL = "http://localhost:9000/oauth2callback";

//var CLIENT_ID = "200067319298-gu6eos6o5cmeaat2tsmlu1s6rk5gjpnd.apps.googleusercontent.com";
//var CLIENT_SECRET = "kN13wxKxV1RuIFsPDnr2Y8H8";
//var REDIRECT_URL = "http://www.sproutup.co/oauth2callback";

var OAuth2 = google.auth.OAuth2;

var oauth2client = new OAuth2(
    config.google.clientID, 
    config.google.clientSecret, 
    config.google.callbackURL);

//global.oauth2Client = oauth2Client; 

module.exports = Promise.promisifyAll(oauth2client);

//Retrieve tokens via token exchange explained above or set them:
// oauth2Client.setCredentials({
//     access_token: 'ya29.swF3k3A-4ZcyWv3EuPNtlci3i00I5Oq0c-SZcF2AS7kK6YRTEj5y2LefNeLidQ4ztzqTaQ',
//     refresh_token: '1/4zz2P5wkWRWx3r3ZKEQBqUKGm3kMGwc2gbzM-w9u0SlIgOrJDtdun6zK6XiATCKT'
// });
