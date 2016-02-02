'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  dynamoose = require('dynamoose'),
  dynamooselib = require('config/lib/dynamoose'),
  express = require(path.resolve('./config/lib/express'));

dynamooselib.loadModels();
var User = dynamoose.model('User');

/**
 * Globals
 */
var app, agent, credentials, user, admin;

/**
 * User routes tests
 */
describe('User CRUD tests', function () {
  before(function (done) {
    // Get application
    app = express.init(dynamoose);
    agent = request.agent(app);
    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'password'
    };

    // Create a new user
    user = new User({
      id: '123',
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new article
    user.save(function () {
      done();
    });
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

console.log('##signin');
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
    user.roles = ['user', 'admin'];

    user.save(function () {
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
            .expect(200)
            .end(function (usersGetErr, usersGetRes) {
              if (usersGetErr) {
                return done(usersGetErr);
              }
console.log('## result: ', usersGetRes);
              usersGetRes.body.should.be.instanceof(Array).and.have.lengthOf(1);

              // Call the assertion callback
              done();
            });
        });
    });
  });

  afterEach(function (done) {
    User.delete().exec(done);
  });
});
