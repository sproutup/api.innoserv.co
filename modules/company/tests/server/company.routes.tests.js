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
      id: '123',
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
    User.createWithSlug(user).then(function() {
      done();
    });
  });

  afterEach(function (done) {
    user.delete(done);
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

        // Save a new article
        // agent.post('/api/articles')
        //   .send(article)
        //   .expect(200)
        //   .end(function (articleSaveErr, articleSaveRes) {
        //     // Handle article save error
        //     if (articleSaveErr) {
        //       return done(articleSaveErr);
        //     }
        //
        //     // Get a list of articles
        //     agent.get('/api/articles')
        //       .end(function (articlesGetErr, articlesGetRes) {
        //         // Handle article save error
        //         if (articlesGetErr) {
        //           return done(articlesGetErr);
        //         }
        //
        //         // Get articles list
        //         var articles = articlesGetRes.body;
        //
        //         // Set assertions
        //         (articles[0].user._id).should.equal(userId);
        //         (articles[0].title).should.match('Article Title');
        //
        //         // Call the assertion callback
        //         done();
        //       });
        //   });
      });
  });
});
