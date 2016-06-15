'use strict';

/**
 * Module dependencies.
 */

var dynamoose = require('dynamoose');
//var dynamooselib = require('config/lib/dynamoose');
/* global -Promise */
var Promise = require('bluebird');
var chai = require('chai');
var should = chai.should;
var expect = chai.expect;
var redis = require('config/lib/redis');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var Channel = dynamoose.model('Channel'),
  Campaign = dynamoose.model('Campaign'),
  Member = dynamoose.model('Member'),
  Message = dynamoose.model('Message'),
  Company = dynamoose.model('Company'),
  Team = dynamoose.model('Team'),
  User = dynamoose.model('User');

/**
 * Globals
 */
var channel1, channel2, _user, _user1, _user2, _company, _campaign, _message;

/**
 * Unit tests
 */
describe('Channel Model Unit Tests:', function () {
  this.timeout(5000);

  before(function () {
    _user = {
      firstName: 'MVP',
      lastName: 'USER',
      displayName: 'MVP USER',
      email: 'mvp@test.com',
      username: 'mvp',
      password: 'password'
    };

    _user1 = {
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'password'
    };

    _user2 = {
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test2@test.com',
      username: 'username2',
      password: 'password'
    };

    _company = new Company({
      name: 'facebook',
      url: 'www.facebook.com',
      slug: 'facebook'
    });

    // Delete members
    return Member.scan().exec().then(function(items){
      return Promise.each(items, function(item){
        return item.delete();
      });
    }).then(function() {
      // Create 2 users

      _user = new User(_user);
      _user1 = new User(_user1);
      _user2 = new User(_user2);
      return Promise.each([_user, _user1, _user2], function(item){
        return item.save();
      });
    }).then(function(res) {
      // Create a company and the team members

      return Company.createWithSlug(_company).then(function(item) {
        _company = item;
        return Promise.each([_user1, _user2], function(item){
          return Team.addTeamMember(item.id, _company.id);
        });
      });
    }).then(function(res) {
      // Create a campaign

      return Campaign.create({ companyId: _company.id }).then(function(item) {
        _campaign = item;
        return true;
      });
    });
  });

  after(function () {
    return Channel.scan().exec().then(function(items){
      return Promise.all(items, function(item){
        return item.delete();
      }).then(function(val){
        return Member.scan().exec().then(function(items){
          return Promise.all(items, function(item){
            return item.delete();
          });
        });
      });
    }).then(function() {
      return User.scan().exec().then(function(items){
        return Promise.all(items, function(item){
          return item.purge();
        });
      });
    }).then(function(){
      return Message.scan().exec().then(function(items){
        return Promise.each(items, function(item){
          return item.delete();
        });
      });
    }).then(function(){
      return Company.scan().exec().then(function(items){
        return Promise.each(items, function(item){
          return item.purge();
        });
      });
    }).then(function(){
      return redis.flushall();
    }).then(function() {
      return true;
    });
  });

  describe('Channel Model Unit Tests: ', function () {
    it('should create channel and add member', function () {
      var create = Channel.createNewChannel(_user.id, '123', 'Campaign:User');

      return Promise.all([
        expect(create).to.eventually.have.property('id').that.equals('123'),
        expect(create).to.eventually.have.property('type').that.equals('Campaign:User'),
        expect(create).to.eventually.have.property('members')
          .that.is.an('array')
          .with.deep.property('[0]')
          .that.deep.property('userId')
          .that.equals(_user.id)
      ]);
    });

    it('should be able to create a campaign channel', function () {
      var create = Channel.createCampaignChannel(_user.id, _campaign.id);
      return Promise.all([
        expect(create).to.eventually.be.fulfilled,
        expect(create).to.eventually.have.property('id').that.equals(_campaign.id + ':' + _user.id),
        expect(create).to.eventually.have.property('type').that.equals('Campaign:User'),
        expect(create).to.eventually.have.property('members')
          .with.deep.property(_user.id)
          .that.deep.property('userId')
          .that.equals(_user.id),
        expect(create).to.eventually.not.have.property('members.' + _user1.id + '.companyId'),
        expect(create).to.eventually.have.property('members')
          .with.deep.property(_user1.id)
          .that.deep.property('companyId')
          .that.equals(_campaign.companyId),
        expect(create).to.eventually.have.property('members')
          .with.deep.property(_user2.id)
          .that.deep.property('companyId')
          .that.equals(_campaign.companyId)
      ]);
    });

    it('should not create channel without a userId', function () {
      var create = Channel.createNewChannel('');
      return expect(create).to.eventually.be.rejected;
    });

    it('should not be able to add a user that doesnt exist', function () {
      var create = Channel.addMember('2', '123');
      return expect(create).to.eventually.be.rejected;
    });

    it('should be able to add a member to a channel', function () {
      var create = Channel.addMember(_user1.id, '123');

      return Promise.all([
        expect(create).to.eventually.be.fulfilled,
        expect(create).to.eventually.have.property('userId').that.equals(_user1.id),
        expect(create).to.eventually.have.property('channelId').that.equals('123')
      ]);
    });

    it('should return the member when we try to add it a second time', function () {
      var create = Channel.addMember(_user1.id, '123');

      return Promise.all([
        expect(create).to.eventually.be.fulfilled,
        expect(create).to.eventually.have.property('userId').that.equals(_user1.id),
        expect(create).to.eventually.have.property('channelId').that.equals('123')
      ]);
    });

    it('should not add a member to a channel twice', function () {
      return Channel.addMember(_user1.id, '123').then(function(){
        var query = Member.query('channelId').eq('123').where('userId').eq(_user1.id).exec();

        return Promise.all([
          expect(query).to.eventually.be.fulfilled,
          expect(query).to.eventually.have.length.of.at.most(1),
          expect(query).to.eventually.have.deep.property('[0]')
        ]);
      });
    });

    it('should not add a member to a channel that doesn\'t exsist', function () {
      var create = Channel.addMember(_user1.id, '666');
      return expect(create).to.eventually.be.rejectedWith(TypeError, 'This channel doesn\'t exist');
    });

    it('should be able to add company members to a channel', function () {
      var create = Channel.addCompanyMembers(_company.id, 123);

      return Promise.all([
        expect(create).to.eventually.be.fulfilled,
        expect(create).to.eventually.be.an('array')
          .with.deep.property('[0]')
          .that.deep.property('userId')
          .that.equals(_user1.id)
      ]);
    });
  });

  describe('Message Model Unit Tests:', function () {
    it('should be able to create a message', function () {
      _message = new Message({
        userId: '1',
        channelId: '123',
        body: 'Testing 1, 2'
      });

      var create = _message.save();

      return Promise.all([
        expect(create).to.eventually.be.fulfilled,
        expect(create).to.eventually.have.property('userId').that.equals('1'),
        expect(create).to.eventually.have.property('channelId').that.equals('123')
      ]);
    });

    it('should be able to add a message to a channel', function () {
      var add = _message.addMessageToChannel();

      return Promise.all([
        expect(add).to.eventually.be.fulfilled,
        expect(add).to.eventually.equal(1)
      ]);
    });

    it('should be able to update members\' channel feeds', function () {
      var update = _message.updateMembersChannelFeed();

      return Promise.all([
        expect(update).to.eventually.be.fulfilled,
        expect(update).to.eventually.equal(true)
      ]);
    });

    it('should be able to get a channel\'s messages', function () {
      var get = Message.getChannelMessages('123');

      return Promise.all([
        expect(get).to.eventually.be.fulfilled,
        expect(get).to.eventually.have.property('messages')
          .that.is.an('array')
          .with.length.of.at.most(1)
          .with.deep.property('[0]')
          .that.deep.property('body')
          .that.equals('Testing 1, 2')
      ]);
    });
  });
});
