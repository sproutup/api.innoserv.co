'use strict';

var should = require('should'),
  request = require('supertest'),
  dynamoose = require('dynamoose'),
  dynamooselib = require('config/lib/dynamoose'),
  express = require('config/lib/express');

dynamooselib.loadModels();
var User = dynamoose.model('User');
var Company = dynamoose.model('Company');

/**
 * Globals
 */
var app, agent, credentials, user, company, admin;

/**
 * Company routes tests
 */
describe('Company CRUD tests', function () {
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

    // Create a new company
    company = new Company({
      id: '123',
      name: 'microsoft',
      url: 'www.mircosoft.com'
    });

    // Save user to the test db
    user.save(function () {
      done();
    });
  });

  it('should not be able to save a company if not logged in', function (done) {
    agent.post('/api/company')
      .send(company)
      .expect(403)
      .end(function (companySaveErr, companySaveRes) {
        // Call the assertion callback
        done(companySaveErr);
      });
  });

  afterEach(function (done) {
    User.delete().exec(done);
  });
});
