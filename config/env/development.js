'use strict';

var defaultEnvConfig = require('./default');

module.exports = {
  db: {
    local: false,
    region: 'us-west-2',
    create: true,
    prefix: 'Dev_'
  },
  log: {
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: 'dev',
    // Stream defaults to process.stdout
    // Uncomment to enable logging to a log on the file system
    options: {
      //stream: 'access.log'
    }
  },
  app: {
    title: defaultEnvConfig.app.title + ' - Development Environment'
  },
  mailer: {
    from: process.env.MAILER_FROM || 'MAILER_FROM',
    options: {
      service: process.env.MAILER_SERVICE_PROVIDER || 'MAILER_SERVICE_PROVIDER',
      auth: {
        user: process.env.MAILER_EMAIL_ID || 'MAILER_EMAIL_ID',
        pass: process.env.MAILER_PASSWORD || 'MAILER_PASSWORD'
      }
    }
  },
  sendgrid: {
    local: true,
    username: process.env.SENDGRID_USERNAME,
    pass: process.env.SENDGRID_PASSWORD
  },
  livereload: false,
  seedDB: process.env.MONGO_SEED || false
};
