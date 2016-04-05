'use strict';

 /* global -Promise */
var Promise = require('bluebird'),
  should = require('should'),
  request = require('supertest'),
  dynamoose = require('dynamoose'),
  express = require('config/lib/express'),
  User = dynamoose.model('User'),
  Company = dynamoose.model('Company');

/**
 * Globals
 */
var app, agent, credentials, user, company, admin;
var _company = {};

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
    Promise.join(
      User.purge(user.id),
      Company.purge(_company.id),
      function () {
        done();
      }
    );
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

        var signedInUser = signinRes.body;

        agent.post('/api/company')
          .send(company)
          .expect(200)
          .end(function (companySaveErr, companySaveRes) {
            if (companySaveErr) {
              return done(companySaveErr);
            }

            // asign company to the _company variable that we use in afterEach for purging purposes
            _company = companySaveRes.body;

            // Set assertions
            (_company.name).should.match('microsoft');
            (_company.team.length).should.match(1);
            (_company.team[0].userId).should.match(signedInUser.id);

            // Get company with slug
            agent.get('/api/slug/' + _company.slug)
              .end(function (companyGetErr, companyGetRes) {
                if (companyGetErr) {
                  return done(companyGetErr);
                }

                company = companyGetRes.body.item;

                // Set assertions
                (company.name).should.match('microsoft');
                (company.team[0].userId).should.match(signedInUser.id);
                (company.team.length).should.match(1);

                done();
              });
          });
      });
  });
});
