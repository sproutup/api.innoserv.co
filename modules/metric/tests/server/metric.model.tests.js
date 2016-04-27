'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var moment = require('moment');
var dynamooselib = require('config/lib/dynamoose');
var Promise = require('bluebird');
var chai = require('chai');
var should = chai.should;
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var Metric = dynamoose.model('Metric');

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
    data1 = {
      id: '1234:followers',
      timestamp: moment('2016-01-01', 'YYYY-MM-DD').unix(),
      refType: 'Service',
      value: 1000
    };
    data2 = {
      id: '1234:followers',
      timestamp: moment('2016-01-02', 'YYYY-MM-DD').unix(),
      refType: 'Service',
      value: 2000
    };
    data3 = {
      id: '1234:followers',
      timestamp: moment('2016-01-03', 'YYYY-MM-DD').unix(),
      refType: 'Service',
      value: 3000
    };
  });

  describe('Method Save', function () {
    it('should begin with no metrics', function () {
      var scan = Metric.scan().exec();
      return expect(scan).to.eventually.have.length(0);
    });

    it('should be able to add followers', function () {
      var update = Metric.create(data1);
      return Promise.all([
        expect(update).to.eventually.have.property('id').and.equals(data1.id),
        expect(update).to.eventually.have.property('timestamp').and.equals(data1.timestamp),
        expect(update).to.eventually.have.property('value').and.equals(data1.value)
      ]);
    });

    it('should be able to get latest followers', function () {
      var update = Metric.queryOne('id').eq(data1.id).descending().exec();
      return Promise.all([
        expect(update).to.eventually.have.property('id').and.equals(data1.id),
        expect(update).to.eventually.have.property('timestamp').and.equals(data1.timestamp),
        expect(update).to.eventually.have.property('value').and.equals(data1.value)
      ]);
    });

    it('should be able to add more followers', function () {
      var update = Metric.create(data2);
      return Promise.all([
        expect(update).to.eventually.have.property('id').and.equals(data2.id),
        expect(update).to.eventually.have.property('timestamp').and.equals(data2.timestamp),
        expect(update).to.eventually.have.property('value').and.equals(data2.value)
      ]);
    });

    it('should be able to get latest followers in timeseries', function () {
      var update = Metric.queryOne('id').eq(data1.id).descending().exec();
      return Promise.all([
        expect(update).to.eventually.have.property('id').and.equals(data2.id),
        expect(update).to.eventually.have.property('timestamp').and.equals(data2.timestamp),
        expect(update).to.eventually.have.property('value').and.equals(data2.value)
      ]);
    });

    it('should be able to add more followers', function () {
      var update = Metric.create(data3);
      return Promise.all([
        expect(update).to.eventually.have.property('id').and.equals(data3.id),
        expect(update).to.eventually.have.property('timestamp').and.equals(data3.timestamp),
        expect(update).to.eventually.have.property('value').and.equals(data3.value)
      ]);
    });

    it('should be able to get latest followers in timeseries', function () {
      var update = Metric.queryOne('id').eq(data1.id).descending().exec();
      return Promise.all([
        expect(update).to.eventually.have.property('id').and.equals(data3.id),
        expect(update).to.eventually.have.property('timestamp').and.equals(data3.timestamp),
        expect(update).to.eventually.have.property('value').and.equals(data3.value)
      ]);
    });


/*
    it('should be able to change twitter followers', function () {
      var userId = '1234';
      var update = Metrics.updateFollowers(userId, 'twitter', 1234);
      return Promise.all([
        expect(update).to.eventually.have.property('refId').and.equals(userId),
        expect(update).to.eventually.have.property('network').and.equals('twitter'),
        expect(update).to.eventually.have.property('followers').and.equals(1234)
      ]);
    });

    it('should be possible to query all metrics for a user', function () {
      var userId = '1234';
      var prm = Metrics.getAll(userId);
      return Promise.all([
        expect(prm).to.eventually.have.property('followers').and.deep.equals({
          twitter: 1234,
          facebook: 2000,
          total: 3234
        })
      ]);
    }); */
  });

  after(function () {
    return Metric.scan().exec().then(function(items){
      return Promise.each(items, function(item){
//        console.log('item: ', item);
        return item.delete();
      });
    });
  });
});
