'use strict';

var defaultEnvConfig = require('./default');

module.exports = {
  secure: false,
//  port: process.env.PORT || 8443,
  db: {
    local: false,
    region: 'us-west-2',
    create: true,
    prefix: 'Prod_'
  },
  log: {
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: 'combined',
    // Stream defaults to process.stdout
    // Uncomment to enable logging to a log on the file system
    options: {
      stream: 'access.log'
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
    local: false,
    username: process.env.SENDGRID_USERNAME || 'SENDGRID',
    pass: process.env.SENDGRID_PASSWORD || 'PASSWORD'
  },
  seedDB: process.env.MONGO_SEED || false
};
