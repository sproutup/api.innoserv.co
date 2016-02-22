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
  sendgrid: {
    templates: {
      approved: '2e5f3c3f-921a-4e36-808f-fe927c3ec267'
    }
  }
};
