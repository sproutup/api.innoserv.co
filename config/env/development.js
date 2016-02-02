'use strict';

var defaultEnvConfig = require('./default');

module.exports = {
  db: {
    local: true,
    region: 'us-west-2',
    create: true,
    prefix: 'Dev_',
    uri: process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://' + (process.env.DB_1_PORT_27017_TCP_ADDR || 'localhost') + '/mean-dev',
    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false
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
  aws: {
    accessKeyID: process.env.AWS_ACCESS_KEY_ID || 'ToDo',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'ToDo',
    s3: {
      region: process.env.AWS_S3_REGION || 'PUT YOUR REGION',
      bucket: process.env.AWS_S3_BUCKET || 'PUT YOUR BUCKET',
      imageFolder: process.env.AWS_S3_IMAGE_FOLDER || 'PUT YOUR FOLDER'
    }
  },
  knex: {
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: 'root',
      database: 'mean_db'
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
    jwt: {
      client_email: process.env.GOOGLE_JWT_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_JWT_PRIVATE_KEY
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
    username: process.env.SENDGRID_USERNAME,
    pass: process.env.SENDGRID_PASSWORD
  },
  livereload: true,
  seedDB: process.env.MONGO_SEED || false
};
