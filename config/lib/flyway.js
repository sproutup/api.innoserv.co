'use strict';

var config = require('../config'),
  exec = require('child_process').exec;

var host = config.knex.connection.host;
var database = config.knex.connection.database;
var user = config.knex.connection.user;
var password = config.knex.connection.password;


// migrates
module.exports.migrate = function (cb) {
  var cmd = 'config/lib/flyway/flyway migrate -url=jdbc:mysql://'+host+':3306/'+database+' -user='+user+' -password='+password;
//  var cmd = 'pwd';
  exec(cmd, function (err, stdout, stderr) {
      if(err){
        console.log('error: ' + err);
        cb(err);
      }

      console.log('stdout: ' + stdout);
      cb(null);
  });
};
