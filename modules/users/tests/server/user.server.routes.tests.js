'use strict';

/* global -Promise */
var Promise = require('bluebird');

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  dynamoose = require('dynamoose'),
  dynamooselib = require('config/lib/dynamoose'),
  express = require(path.resolve('./config/lib/express')),
  redis = require('config/lib/redis'),
  crypto = Promise.promisifyAll(require('crypto'));

//dynamooselib.loadModels();
var User = dynamoose.model('User');

/**
 * Globals
 */
var app, agent, credentials, credentials_admin, user, admin, _user, _admin;

/**
 * User routes tests
 */
describe('User CRUD tests', function () {
  this.timeout(5000);

  before(function (done) {
    // Get application
    app = express.init(dynamooselib);
    agent = request.agent(app);
    done();
  });

  beforeEach(function () {
    // Create user credentials
    credentials = {
      username: 'user@test.com',
      password: 'password'
    };

    credentials_admin = {
      username: 'admin@test.com',
      password: 'password'
    };


    // Create a new user
    user = {
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: credentials.username,
      username: 'username123',
      password: credentials.password,
      provider: 'local'
    };

    // Create a new admin user
    admin = {
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Full Name',
      email: 'admin@test.com',
      username: 'username4321',
      password: credentials_admin.password,
      provider: 'local',
      roles: ['user', 'admin']
    };

    // Save user to the test db
    return Promise.join(
      User.createWithSlug(user),
      User.createWithSlug(admin)
    );
  });

  it('should not be able to retrieve a list of users if not admin', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new article
        agent.get('/api/users')
          .expect(403)
          .end(function (usersGetErr, usersGetRes) {
            if (usersGetErr) {
              return done(usersGetErr);
            }

            return done();
          });
      });
  });

  it('should be able to retrieve a list of users if admin', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials_admin)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }
        // Save a new article
        agent.get('/api/users')
          .expect(200)
          .end(function (usersGetErr, usersGetRes) {
            if (usersGetErr) {
              return done(usersGetErr);
            }
            usersGetRes.body.should.be.instanceof(Array).and.have.lengthOf(2);

            // Call the assertion callback
            done();
          });
      });
  });

  it('should be able to send a verification email if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Send email verification
        agent.post('/api/auth/email/verification')
          .expect(200)
          .end(function (usersPostErr, usersPostRes) {
            if (usersPostErr) {
              return done(usersPostErr);
            }

            done();
          });
      });
  });

  it('should be able to confirm an email address', function (done) {
    var token;

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        if (signinErr) {
          return done(signinErr);
        }

        crypto.randomBytesAsync(20).then(function(buffer) {
          token = buffer.toString('hex');
          redis.hmset('token:' + token, { 'userId': signinRes.body.id, 'email': signinRes.body.email });

          agent.get('/api/auth/email/confirmation/' + token)
            .expect(200)
            .end(function (usersPostErr, usersPostRes) {
              if (usersPostErr) {
                return done(usersPostErr);
              }

              done();
            });
        });
      });
  });

  afterEach(function () {
    return User.scan().exec().then(function(items){
      return Promise.each(items, function(item){
        return User.purge(item.id);
      });
    });
  });
});
