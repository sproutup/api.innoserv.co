'use strict';

/* global -Promise */
var Promise = require('bluebird');

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  dynamoose = require('dynamoose'),
  dynamooselib = require('config/lib/dynamoose'),
  express = require(path.resolve('./config/lib/express'));

//dynamooselib.loadModels();
var User = dynamoose.model('User');

/**
 * Globals
 */
var app, agent, credentials, credentials_admin, user, admin;

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
      id: '123',
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'user@test.com',
      username: 'username123',
      password: credentials.password,
      provider: 'local'
    };

    // Create a new admin user
    admin = {
      id: '4321',
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Full Name',
      email: 'admin@test.com',
      username: 'username4321',
      password: credentials_admin.password,
      provider: 'local',
      roles: ['user', 'admin']
    };


    // Save a user to the test db and create new article
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
            console.log('err: ', signinErr);
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

  afterEach(function () {
    return User.scan().exec().then(function(items){
      return Promise.each(items, function(item){
        return User.purge(item.id);
      });
    });
  });
});
