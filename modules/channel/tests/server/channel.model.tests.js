'use strict';

/**
 * Module dependencies.
 */

var dynamoose = require('dynamoose');
var dynamooselib = require('config/lib/dynamoose');
/* global -Promise */
var Promise = require('bluebird');
var chai = require('chai');
var should = chai.should;
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var Channel = dynamoose.model('Channel'),
  Campaign = dynamoose.model('Campaign'),
  Member = dynamoose.model('Member'),
  Company = dynamoose.model('Company'),
  Team = dynamoose.model('Team'),
  User = dynamoose.model('User');

/**
 * Globals
 */
var channel1, channel2, _user1, _user2, _company, _campaign;

/**
 * Unit tests
 */
describe('Channel Model Unit Tests:', function () {
  this.timeout(5000);

  before(function () {
    Channel.delete({});

    _user1 = {
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'password',
      provider: 'local'
    };

    _user2 = {
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test2@test.com',
      username: 'username2',
      password: 'password',
      provider: 'local'
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

      _user1 = new User(_user1);
      _user2 = new User(_user2);
      return Promise.each([_user1, _user2], function(item){
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
      });
    });
  });

  after(function (done) {
    Channel.scan().exec().then(function(items){
      Promise.all(items, function(item){
        return item.delete();
      }).then(function(val){
        Member.scan().exec().then(function(items){
          Promise.all(items, function(item){
            return item.delete();
          });
        });
      });
    }).then(function() {
      User.scan().exec().then(function(items){
        Promise.all(items, function(item){
          return item.delete();
        });
      });
    }).then(function() {
      done();
    });
  });

  describe('Method Save', function () {
    it('should create channel and add member', function () {
      var create = Channel.createNewChannel('1', '123', 'Campaign:User').then(function (data) {
        channel1 = data;
        data.members[0].channelId.should.equal(data.id);
        return data;
      }).catch(function(err){
        return err;
      });

      return Promise.all([
        expect(create).to.eventually.have.property('id').that.equals('123'),
        expect(create).to.eventually.have.property('type').that.equals('Campaign:User'),
        expect(create).to.eventually.have.property('members')
          .that.is.an('array')
          .with.deep.property('[0]')
          .that.deep.property('userId')
          .that.equals('1')
      ]);
    });

    it('should be able to create a campaign channel', function () {
      var create = Channel.createCampaignChannel('1', _campaign.id);
      return Promise.all([
        expect(create).to.eventually.be.fulfilled,
        expect(create).to.eventually.have.property('id').that.equals(_campaign.id + ':1'),
        expect(create).to.eventually.have.property('type').that.equals('Campaign:User'),
        expect(create).to.eventually.have.property('members')
          .that.is.an('array')
          .with.deep.property('[0]')
          .that.deep.property('userId')
          .that.equals('1')
      ]);
    });

    it('should not a create channel without a userId', function () {
      var create = Channel.createNewChannel('');
      return expect(create).to.eventually.be.rejected;
    });

    it('should be able to add a member to a channel', function () {
      var create = Channel.addMember('2', channel1.id);

      return Promise.all([
        expect(create).to.eventually.be.fulfilled,
        expect(create).to.eventually.have.property('userId').that.equals('2'),
        expect(create).to.eventually.have.property('channelId').that.equals(channel1.id)
      ]);
    });

    it('should return the member when we try to add it a second time', function () {
      var create = Channel.addMember('2', channel1.id);

      return Promise.all([
        expect(create).to.eventually.be.fulfilled,
        expect(create).to.eventually.have.property('userId').that.equals('2'),
        expect(create).to.eventually.have.property('channelId').that.equals(channel1.id)
      ]);
    });

    it('should not add a member to a channel twice', function () {
      var query = Member.query('channelId').eq(channel1.id).where('userId').eq('2').exec();

      return Promise.all([
        expect(query).to.eventually.be.fulfilled,
        expect(query).to.eventually.have.length.of.at.most(1),
        expect(query).to.eventually.have.deep.property('[0]')
      ]);
    });

    it('should not add a member to a channel that doesn\'t exsist', function () {
      var create = Channel.addMember('1', '666');
      return expect(create).to.eventually.be.rejectedWith(TypeError, 'This channel doesn\'t exist');
    });

    it('should be able to add company members to a channel', function () {
      var create = Channel.addCompanyMembers(_company.id, channel1.id);

      return Promise.all([
        expect(create).to.eventually.be.fulfilled,
        expect(create).to.eventually.be.an('array')
          .with.deep.property('[0]')
          .that.deep.property('userId')
          .that.equals(_user1.id)
      ]);
    });

    // it('should not add company members to a channel that doesn\'t exsist', function () {
    //   var create = Channel.addCompanyMembers(_company.id, '666');
    //   return expect(create).to.eventually.be.rejectedWith(TypeError, 'This channel doesn\'t exirt');
    // });

  });
});
