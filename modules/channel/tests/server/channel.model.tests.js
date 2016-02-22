'use strict';

/**
 * Module dependencies.
 */

var dynamooselib = require('config/lib/dynamoose');
/* global -Promise */
var Promise = require('bluebird');

var should = require('should'),
  dynamoose = require('dynamoose'),
  Channel = dynamoose.model('Channel'),
  Member = dynamoose.model('Member');

/**
 * Globals
 */
var channel1, channel2;

/**
 * Unit tests
 */
describe('Channel Model Unit Tests:', function () {
  this.timeout(5000);

  before(function () {
    channel1 = {
      id: '123',
      userId: '123',
      refId: '321',
      title: 'channel 1'
    };
    channel2 = {
      id: '456',
//      userId: '123',
      refId: '654',
      title: 'channel 2'
    };
  });

  after(function (done) {
    Channel.scan().exec().then(function(items){
      Promise.all(items, function(item){
        return item.delete();
      }).then(function(val){
        Member.scan().exec().then(function(items){
          Promise.all(items, function(item){
            console.log('delete member');
            return item.delete();
          }).then(function(val){
            done();
          });
        });
      });
    });
  });

  describe('Method Save', function () {
    it('should be able to save and delete without problems', function (done) {
      var _ch = new Channel(channel1);
      _ch.save(function (err) {
        should.not.exist(err);
        _ch.delete(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should be able to show an error when try to save without userId', function (done) {
      try {
        Channel.create(channel2, function (err, data) {
          should.exist(err);
          done();
        });
      } catch(err){
        should.exist(err);
        done();
      }
    });

    it('should create channel and add member', function (done) {
      Channel.createNewChannel('123', '321', 'User').then(function (data) {
        data.userId.should.equal('123');
        data.refId.should.equal('321');
        data.refType.should.equal('User');
        data.members.should.have.length(1);
        data.members[0].userId.should.equal('123');
        data.members[0].channelId.should.equal(data.id);
        done();
      }).catch(function(err){
        should.not.exist(err);
        done();
      });
    });

  });
});
