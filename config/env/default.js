'use strict';

module.exports = {
  app: {
    title: 'api.sproutup.co',
    description: 'API Server',
    keywords: 'dynamodb, mysql, redis, express, angularjs, node.js, bookshelf, passport',
    googleAnalyticsTrackingID: process.env.GOOGLE_ANALYTICS_TRACKING_ID || 'GOOGLE_ANALYTICS_TRACKING_ID'
  },
  port: process.env.PORT || 3333,
  templateEngine: 'swig',
  // Session details
  // session expiration is set by default to 24 hours
  sessionExpiration: 24 * (60 * 1000),
  // sessionSecret should be changed for security measures and concerns
  sessionSecret: 'MEAN',
  // sessionKey is set to the generic sessionId key used by PHP applications
  // for obsecurity reasons
  sessionKey: 'sessionId',
  sessionCollection: 'sessions',
  logo: 'modules/core/img/brand/logo.png',
  //favicon: 'modules/core/client/img/brand/favicon-96x96.png',
  flyway: false,
  domain: process.env.domain || 'http://localhost:3030/'
};
