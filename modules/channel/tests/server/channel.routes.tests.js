'use strict';

var should = require('should'),
  request = require('supertest'),
  dynamoose = require('dynamoose'),
  dynamooselib = require('config/lib/dynamoose'),
  express = require('config/lib/express');

var User = dynamoose.model('User');
var Channel = dynamoose.model('Channel');

/**
 * Globals
 */
var app, agent, credentials, user, userdata, channel, admin;


/**
 * Company routes tests
 */
describe('Channel routes tests', function () {
  this.timeout(5000);

  before(function (done) {
    // Get application
    app = express.init(dynamooselib);
    agent = request.agent(app);
/*
  after(function (done) {
    Channel.scan().exec().then(function(items){
      Promise.all(items, function(item){
        return item.delete();
      }).then(function(val){
        done();
      });
    });
  });
*/
    // Create user credentials
    credentials = {
      username: 'test@test.com',
      password: 'password'
    };

    // Create a new user
    userdata = {
      id: '123',
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: credentials.password,
      provider: 'local'
    };

    // Create a new channel
    channel = new Channel({
      id: '123',
      userId: '123',
      title: 'random',
      refId: 'xyz'
    });

    // Save user to the test db
    User.createWithSlug(userdata).then(function(res) {
      user = res;
      done();
    });
  });

  after(function (done) {
    User.purge(user.id).then(function(){
      done();
    });
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

  // it('should be able to save a channel if logged in', function (done) {
  //   agent.post('/api/auth/signin')
  //     .send(credentials)
  //     .expect(200)
  //     .end(function (signinErr, signinRes) {
  //       console.log('signinRes', signinRes);
  //       console.log('signinRes', signinErr);
  //       // Handle signin error
  //       if (signinErr) {
  //           console.log('err: ', signinErr);
  //         return done(signinErr);
  //       }

  //       agent.post('/api/channel')
  //         .send(channel)
  //         .expect(200)
  //         .end(function (err, res) {
  //           console.log('error: ', err);
  //           console.log('res: ', res);
  //           // Call the assertion callback
  //           done(err);
  //         });
  //      });
  // });
});
