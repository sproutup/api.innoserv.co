'use strict';

var should = require('should'),
  request = require('supertest'),
  dynamoose = require('dynamoose'),
//  dynamooselib = require('config/lib/dynamoose'),
  express = require('config/lib/express');

//dynamooselib.loadModels();
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
  this.timeout(5000);

  before(function (done) {
    // Get application
    app = express.init(dynamoose);
    agent = request.agent(app);
    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'test@test.com',
      password: 'password'
    };

    // Create a new user
    user = {
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: credentials.password,
      provider: 'local'
    };

    // Create a new company
    company = new Company({
      id: '123',
      name: 'microsoft',
      url: 'www.mircosoft.com',
      slug: 'microsoft'
    });

    // Save user to the test db
    User.createWithSlug(user).then(function(res) {
      user = res;
      done();
    });
  });

  afterEach(function (done) {
    User.purge(user.id).then(function() {
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

  it('should be able to save a company if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        agent.post('/api/company')
          .send(company)
          .expect(200)
          .end(function (companySaveErr, companySaveRes) {
            if (companySaveErr) {
              return done(companySaveErr);
            }

            // Get a list of companies
            agent.get('/api/company')
              .end(function (companiesGetErr, companiesGetRes) {
                if (companiesGetErr) {
                  return done(companiesGetErr);
                }

                var companies = companiesGetRes.body;
                console.log('companies', companies);

                // Set assertions
                (companies[0].name).should.match('microsoft');

                done();
              });
          });
      });
  });
});
