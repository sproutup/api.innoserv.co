'use strict';

/**
 * Module dependencies.
 */

// Add the root project directory to the app module search path: 
require('app-module-path').addPath(__dirname);

var app = require('./config/lib/app');
var server = app.start();
