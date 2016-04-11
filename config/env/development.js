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
  knex: {
    client: 'mysql',
    connection: {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root',
      database: process.env.MYSQL_DATABASE || 'sproutup_db'
    },
    pool: {
      min: 2,
      max: 10
    }
  },
  facebook: {
    clientID: process.env.FACEBOOK_ID || 'APP_ID',
    clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/facebook/callback'
  },
  twitter: {
    clientID: process.env.TWITTER_CONSUMER_KEY || 'CONSUMER_KEY',
    clientSecret: process.env.TWITTER_CONSUMER_SECRET || 'CONSUMER_SECRET',
    accessID: process.env.TWITTER_ACCESS_TOKEN || 'ACCESS_TOKEN',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || 'ACCESS_SECRET',
    callbackURL: '/api/auth/twitter/callback'
  },
  google: {
    clientID: process.env.GOOGLE_ID || 'APP_ID',
    clientSecret: process.env.GOOGLE_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/google/callback',
    baseURL: 'https://',
    accessTokenURL: 'www.googleapis.com/oauth2/v3/token',
    jwt: {
      client_email: process.env.GOOGLE_JWT_CLIENT_EMAIL || 'EMAIL',
      private_key: process.env.GOOGLE_JWT_PRIVATE_KEY || 'KEY'
    },
    calendar: {
      id: process.env.GOOGLE_CALENDAR_ID
    }
  },
  linkedin: {
    clientID: process.env.LINKEDIN_ID || 'APP_ID',
    clientSecret: process.env.LINKEDIN_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/linkedin/callback'
  },
  github: {
    clientID: process.env.GITHUB_ID || 'APP_ID',
    clientSecret: process.env.GITHUB_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/github/callback'
  },
  paypal: {
    clientID: process.env.PAYPAL_ID || 'CLIENT_ID',
    clientSecret: process.env.PAYPAL_SECRET || 'CLIENT_SECRET',
    callbackURL: '/api/auth/paypal/callback',
    sandbox: true
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
