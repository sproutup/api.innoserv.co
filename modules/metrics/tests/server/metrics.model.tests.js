'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var dynamooselib = require('config/lib/dynamoose');
var Promise = require('bluebird');
var chai = require('chai');
var should = chai.should;
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var Metrics = dynamoose.model('Metrics');

/**
 * Globals
 */
var data1, data2, data3;

/**
 * Unit tests
 */
describe('Metrics Model Unit Tests:', function () {
  this.timeout(5000);

  before(function () {
//    slug1 = {
//      id: 'ibm',
//      refId: '1234',
//      refType: 'Company'
//    };
//    slug2 = {
//      id: 'microsoft',
//      refId: '2345',
//      refType: 'Company'
//    };
//    slug3 = {
//      id: 'apple',
//      refId: '3456',
//      refType: 'Company'
//    };
  });

  describe('Method Save', function () {
    it('should begin with no metrics', function () {
      var scan = Metrics.scan().exec();
      return expect(scan).to.eventually.have.length(0);
    });

    it('should be able to add twitter followers', function () {
      var userId = '1234';
      var update = Metrics.updateFollowers(userId, 'twitter', 1000);
      return Promise.all([
        expect(update).to.eventually.have.property('refId').and.equals(userId),
        expect(update).to.eventually.have.property('network').and.equals('twitter'),
        expect(update).to.eventually.have.property('followers').and.equals(1000)
      ]);
    });

    it('should be able to add facebook followers', function () {
      var userId = '1234';
      var update = Metrics.updateFollowers(userId, 'facebook', 2000);
      return Promise.all([
        expect(update).to.eventually.have.property('refId').and.equals(userId),
        expect(update).to.eventually.have.property('network').and.equals('facebook'),
        expect(update).to.eventually.have.property('followers').and.equals(2000)
      ]);
    });

    it('should be able to change twitter followers', function () {
      var userId = '1234';
      var update = Metrics.updateFollowers(userId, 'twitter', 1234);
      return Promise.all([
        expect(update).to.eventually.have.property('refId').and.equals(userId),
        expect(update).to.eventually.have.property('network').and.equals('twitter'),
        expect(update).to.eventually.have.property('followers').and.equals(1234)
      ]);
    });

    it('should be able to query all network followers', function () {
      var userId = '1234';
      var prm = Metrics.getAll(userId);
      return Promise.all([
        expect(prm).to.eventually.have.property('followers').and.deep.equals({
          twitter: 1234,
          facebook: 2000,
          total: 3234
        })
      ]);
    });
  });

  after(function () {
    return Metrics.scan().exec().then(function(items){
      return Promise.each(items, function(item){
        console.log('item: ', item);
        return item.delete();
      });
    });
  });
});
