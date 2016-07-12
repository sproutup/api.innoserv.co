'use strict';

module.exports = {
  app: {
    title: 'api.sproutup.co',
    description: 'API Server',
    keywords: 'dynamodb, mysql, redis, express, angularjs, node.js, bookshelf, passport',
    googleAnalyticsTrackingID: process.env.GOOGLE_ANALYTICS_TRACKING_ID || 'GOOGLE_ANALYTICS_TRACKING_ID'
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || '6379'
  },
  elasticsearch: {
    host: process.env.ELASTICSEARCH_HOST || '127.0.0.1:9200',
    port: process.env.ELASTICSEARCH_LOG || 'INFO'
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
  port: process.env.PORT || 3333,
  templateEngine: 'swig',
  // Session Cookie settings
  sessionCookie: {
    // session expiration is set by default to 7 * 24 hours
    maxAge: 7 * 24 * (60 * 60 * 1000),
    // httpOnly flag makes sure the cookie is only accessed
    // through the HTTP protocol and not JS/browser
    httpOnly: true,
    // secure cookie should be turned to true to provide additional
    // layer of security so that the cookie is set only when working
    // in HTTPS mode.
    secure: false
  },
  // sessionSecret should be changed for security measures and concerns
  sessionSecret: 'MEAN',
  // sessionKey is set to the generic sessionId key used by PHP applications
  // for obsecurity reasons
  sessionKey: 'sessionId',
  sessionCollection: 'sessions',
  logo: 'modules/core/img/brand/logo.png',
  //favicon: 'modules/core/client/img/brand/favicon-96x96.png',
  flyway: false,
  domains: {
    creator: process.env.creatorDomain || 'http://localhost:3030/',
    mvp: process.env.mvpDomain || 'http://localhost:9000/'
  },
  aws: {
    accessKeyID: process.env.AWS_ACCESS_KEY_ID || 'ToDo',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'ToDo',
    s3: {
      region: process.env.AWS_S3_REGION || 'PUT YOUR REGION',
      bucket: process.env.AWS_S3_BUCKET || 'PUT YOUR BUCKET',
      imageFolder: process.env.AWS_S3_IMAGE_FOLDER || 'PUT YOUR FOLDER'
    },
    cloudfront: {
      files: process.env.AWS_CLOUDFRONT_FILES || 'PUT YOUR CLOUDFRONT INFO'
    }
  },
  instagram: {
    clientID: process.env.INSTAGRAM_ID || 'APP_ID',
    clientSecret: process.env.INSTAGRAM_SECRET || 'APP_SECRET',
    callbackURL: '/api/auth/instagram/callback',
    scope: ['basic'] // 'comments relationships likes'
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
  sendgrid: {
    templates: {
      recommend2brand: '0a7e7b26-cf1e-4b0f-9184-9329088abb2a',
      recommended: '6c37cd0c-784d-4541-9991-092853e1bfef',
      approved: '2e5f3c3f-921a-4e36-808f-fe927c3ec267',
      message: '2530a4ef-a779-4050-b1ff-01a8c5dfe1ff',
      verification: '4ff03cde-62c2-4148-ab56-fe467a3fe5ef',
      campaignToReview: '32a64a16-5537-4a59-a26e-014cc13d4794',
      campaignApproved: 'f25c5991-5456-4151-8871-8b3fa2e59c29',
      campaignDisapproved: '058f5ed0-f7b2-4952-abb5-14822d82e1cb',
      forgot: {
        password: 'd46dbccc-3eb8-4788-9b8a-330d5d3aecdf'
      },
      campaignStarted: 'missing template',
      invite: 'e9a954ba-8ca4-45ba-b212-55b68cb1edfb'
    }
  },
  admin: {
    users: process.env.ADMIN_USERS
  }
};
