'use strict';

var defaultEnvConfig = require('./default');

module.exports = {
  db: {
    uri: process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://' + (process.env.DB_1_PORT_27017_TCP_ADDR || 'localhost') + '/mean-dev',
    options: {
      user: '',
      pass: ''
    },
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
  redis: {
    port: process.env.REDIS_PORT || 6379, // Redis port
    host: process.env.REDIS_HOST || '127.0.0.1', // Redis host
    db: process.env.REDIS_DB || 0  // Redis databases
  },
  dynamodb: {
    local: true
  },
  aws: {
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
    baseURL: 'https://',
    callbackURL: 'http://localhost:9000/oauth2callback',
    requestURL: 'www.facebook.com/v2.0/dialog/oauth',
    authorizeURL: 'www.facebook.com/v2.0/dialog/oauth',
    accessTokenURL: 'graph.facebook.com/v2.0/oauth/access_token',
    scope: 'user_friends email public_profile user_likes' // 'email user_likes user_about_me user_posts read_insights'
  },
  instagram: {
    clientID: process.env.INSTAGRAM_ID || 'APP_ID',
    clientSecret: process.env.INSTAGRAM_SECRET || 'APP_SECRET',
    baseURL: 'https://api.instagram.com',
    callbackURL: 'http://localhost:9000/oauth/2/callback',
//    requestURL: 'https://api.instagram.com/oauth/authorize',
//    authorizeURL: 'oauth/access_token',
//    accessTokenURL: '/oauth/access_token',
    scope: 'basic', // 'comments relationships likes',
    grant: 'authorization_code'
  },
  pinterest: {
    clientID: process.env.PINTEREST_ID || 'APP_ID',
    clientSecret: process.env.PINTEREST_SECRET || 'APP_SECRET',
    baseURL: 'https://api.pinterest.com',
    requestURL: '/oauth',
    accessTokenURL: '/v1/oauth/token',
    callbackURL: 'https://localhost:9000/oauth/2/callback',
//    requestURL: 'https://api.pinterest.com/oauth/',
    authorizeURL: 'https://api.pinterest.com/v1/oauth/token',
    scope: 'read_public write_public read_relationships write_relationships',
    grant: 'authorization_code'
  },
  twitter: {
    clientID: process.env.TWITTER_CONSUMER_KEY || 'CONSUMER_KEY',
    clientSecret: process.env.TWITTER_CONSUMER_SECRET || 'CONSUMER_SECRET',
    accessID: process.env.TWITTER_ACCESS_TOKEN || 'ACCESS_TOKEN',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || 'ACCESS_SECRET',
    callbackURL: 'http://localhost:9000/oauth/1/callback',
    requestURL: 'https://api.twitter.com/oauth/request_token',
    authorizeURL: 'https://api.twitter.com/oauth/authorize',
    accessTokenURL: 'https://api.twitter.com/oauth/access_token'
  },
  google: {
    clientID: process.env.GOOGLE_ID || 'APP_ID',
    clientSecret: process.env.GOOGLE_SECRET || 'APP_SECRET',
    baseURL: 'https://',
    callbackURL: 'http://localhost:9000/oauth2callback',
    requestURL: 'accounts.google.com/o/oauth2/auth',
    accessTokenURL: 'www.googleapis.com/oauth2/v3/token',
    revokeURL: '/o/oauth2/revoke',
    scope: {
      yt: 'https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly',
      ga: 'https://www.googleapis.com/auth/analytics.readonly'
    },
    grant: 'authorization_code'
  },
  ga: {
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
  livereload: true,
  seedDB: process.env.MONGO_SEED || false
};
