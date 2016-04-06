'use strict';

/**
 * Module dependencies.
 */

var dynamooselib = require('config/lib/dynamoose');
/* global -Promise */
var Promise = require('bluebird');
var should = require('should');
var dynamoose = require('dynamoose');
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
  });

  describe('Method Save', function () {
    it('should begin with no slugs', function (done) {
      Slug.scan({}, function (err, slugs) {
        slugs.should.have.length(0);
        done();
      });
    });

    it('should be able to save without problems', function (done) {
      Slug.createWrapper(slug1).then(function (slug) {
        slug.delete(function (err) {
          should.not.exist(err);
          done();
        });
      }).catch(function(err){
        should.not.exist(err);
        done();
      });
    });

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

  });

  after(function (done) {
//    Slug.$__.table.delete(function(err){
//      delete dynamoose.models.Slug;
//      done();
//    });
    Slug.scan().exec().then(function(items){
      Promise.all(items, function(item){
        console.log('delete: ', item.id);
        return item.delete();
      }).then(function(val){
        done();
      });
    });
  });
});
