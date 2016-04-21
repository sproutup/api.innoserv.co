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

var Slug = dynamoose.model('Slug');

/**
 * Globals
 */
var slug1, slug2, slug3;

/**
 * Unit tests
 */
describe('Slug Model Unit Tests:', function () {
  this.timeout(5000);

  before(function () {
    slug1 = {
      id: 'ibm',
      refId: '1234',
      refType: 'Company'
    };
    slug2 = {
      id: 'microsoft',
      refId: '2345',
      refType: 'Company'
    };
    slug3 = {
      id: 'apple',
      refId: '3456',
      refType: 'Company'
    };

    return Slug.scan().exec().then(function(items){
      return Promise.each(items, function(item){
        return item.delete();
      });
    });
  });

  describe('Method Save', function () {
    it('should begin with no slugs', function () {
      var scan = Slug.scan().exec();
      return expect(scan).to.eventually.have.length(0);
    });

    it('should be able to save without problems', function () {
      var create = Slug.createWrapper(slug1);
      return expect(create).to.eventually.have.property('id');
    });

    it('should be able to find unique slug when slug exists', function () {
      var unique = Slug.findUniqueSlug(slug1.id);
      expect(unique).to.eventually.include('ibm');
      return expect(unique).to.eventually.have.length.above(10);
    });

    it('should be able to find unique slug when slug not exists', function () {
      var unique = Slug.findUniqueSlug(slug2.id);
      return expect(unique).to.eventually.equal(slug2.id);
    });


/*
    it('should fail to save an existing slug again', function (done) {
      var _slug;
      Slug.createWrapper(slug1).then(function (_slug1) {
        _slug = _slug1;
        return _slug1;
      }).then(function(resslug1){
        should.exist(resslug1);
        return Slug.createWrapper(slug1);
      }).then(function(resslug2){
        should.not.exist(resslug2);
        done();
      }).catch(function(err){
        should.exist(err);
        _slug.delete().then(function() {
          should.not.exist(err);
          done();
        });
      });
    });
*/
  });

  after(function () {
    return Slug.scan().exec().then(function(items){
      return Promise.each(items, function(item){
        return item.delete();
      });
    });
  });
});
