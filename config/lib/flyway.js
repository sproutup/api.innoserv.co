'use strict';

var config = require('../config'),
  exec = require('child_process').exec;

var host = config.db.knex.connection.host;
var database = config.db.knex.connection.database;
var user = config.db.knex.connection.user;
var password = config.db.knex.connection.password;


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

