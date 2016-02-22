'use strict';

var should = require('should'),
  request = require('supertest'),
  dynamoose = require('dynamoose'),
  dynamooselib = require('config/lib/dynamoose'),
  express = require('config/lib/express');

dynamooselib.loadModels();
var User = dynamoose.model('User');
var Channel = dynamoose.model('Channel');

/**
 * Globals
 */
var app, agent, credentials, user, channel, admin;

/**
 * Company routes tests
 */
describe('Channel CRUD tests', function () {
  this.timeout(5000);

  before(function (done) {
    // Get application
    app = express.init(dynamooselib);
    agent = request.agent(app);
    done();
  });

  after(function (done) {
    Channel.scan().exec().then(function(items){
      Promise.all(items, function(item){
        return item.delete();
      }).then(function(val){
        done();
      });
    });
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'test@test.com',
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

    // Create a new channel
    channel = new Channel({
      id: '123',
      userId: '123',
      title: 'random',
      refId: 'xyz'
    });

    // Save user to the test db
    user.save(function () {
      done();
    });
  });

  afterEach(function (done) {
    user.delete(done);
  });

  it('should not be able to save a channel if not logged in', function (done) {
    agent.post('/api/channel')
      .send(channel)
      .expect(403)
      .end(function (err, res) {
        // Call the assertion callback
        done(err);
      });
  });

  it('should be able to save a channel if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
            console.log('err: ', signinErr);
          return done(signinErr);
        }

        agent.post('/api/channel')
          .send(channel)
          .expect(200)
          .end(function (err, res) {
            // Call the assertion callback
            done(err);
          });
       });
  });
});
