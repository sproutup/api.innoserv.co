'use strict';

var should = require('should'),
  request = require('supertest'),
  dynamoose = require('dynamoose'),
  dynamooselib = require('config/lib/dynamoose'),
  /* global -Promise */
  Promise = require('bluebird'),
  express = require('config/lib/express'),
  User = dynamoose.model('User'),
  Campaign = dynamoose.model('Campaign'),
  Company = dynamoose.model('Company'),
  debug = require('debug')('up:debug:campaign:routes:tests');

/**
 * Globals
 */
var app, agent, credentials, credentials_admin, user, company, userdata, campaign, _campaign, admin;

/**
 * Company routes tests
 */
describe('Campaign routes tests', function () {
  this.timeout(5000);

  before(function (done) {
    // Get application
    app = express.init(dynamooselib);
    agent = request.agent(app);

    credentials = {
      username: 'test@test.com',
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
      email: 'test123@test.com',
      username: 'username',
      password: credentials.password,
      provider: 'local'
    };

    // Create a new admin user
    admin = new User ({
      id: '456',
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Full Name',
      email: 'admin@test.com',
      username: 'user456',
      password: credentials_admin.password,
      provider: 'local',
      roles: ['user', 'admin']
    });

    // Create a new company
    company = new Company({
      id: '123',
      name: 'microsoft',
      url: 'www.microsoft.com',
      slug: 'microsoft'
    });

    Company.createWithSlug(company).then(function(res2) {
      company = res2;

      campaign = {
        name: 'Get The Keys',
        companyId: company.id,
        description: 'marketing key',
        hashtag: 'ifihadthekeys',
        instructions: '1. ball out. 2. ball out mas.',
        productId: '321',
        tagline: 'Get the keys you need',
        type: 'trial'
      };

      return User.createWithSlug(user).then(function(res) {
        debug('user created: ', res.id);
        user = res;
        return User.createWithSlug(admin);
      }).then(function(res1){
        admin = res1;
        done();
      });
    });
  });

  after(function (done) {
    Promise.join(
      User.purge(user.id),
      User.purge(admin.id),
      Company.purge(company.id)
    ).then(function() {
      done();
    });
  });

  it('should be able to save a campaign', function (done) {
    agent.post('/api/campaign')
      .send(campaign)
      .expect(200)
      .end(function (err, res) {
        _campaign = res.body;
        done(err);
      });
  });

  it('should not be able to appove a campaign if the user is not an admin', function (done) {
    _campaign.status = 10;

    debug('signing in: ', credentials.username);
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.put('/api/campaign/' + _campaign.id)
          .send(_campaign)
          .expect(403)
          .end(function (err, res) {
            done(err);
          });
      });
  });

  it('should be able to approve a campaign if the user is an admin', function (done) {
    _campaign.status = 10;

    debug('signing in: ', credentials.username);
    agent.post('/api/auth/signin')
      .send(credentials_admin)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        agent.put('/api/campaign/' + _campaign.id)
          .send(_campaign)
          .expect(200)
          .end(function (err, res) {
            done(err);
          });
      });
  });

});
