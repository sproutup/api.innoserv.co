'use strict';

/**
 * Module dependencies.
 */
 /* global -Promise */
var Promise = require('bluebird');
var _ = require('lodash');
var debug = require('debug')('up:debug:company:model');
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var slug = require('slug');
var redis = require('config/lib/redis');
var domain = require('parse-domain');
var cache = require('config/lib/cache');

/**
 * Article Schema
 */
var CompanySchema = new Schema({
  id: {
    type: String,
    default: function(){ return intformat(flakeIdGen.next(), 'dec'); },
    hashKey: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    default: '',
    trim: true,
    required: true
  },
  slug: {
    type: String,
    index: {
      global: true,
      project: true,
      name: 'index_company_slug'
    }
  },
  domain: {
    type: String,
    index: {
      global: true,
      project: true,
      name: 'index_company_domain'
    }
  },
  address: {
    type: String
  },
  phone: {
    type: String
  },
  tagline: {
    type: String
  },
  url: {
    type: String,
    default: '',
    trim: true
  },
  banner: {
    fileId: {
      type: String
    }
  }
});

CompanySchema.statics.find = function (id) {
  var _this = this;

  return redis.hgetall('company:'+id)
    .then(function(company){
      if(_.isEmpty(company)){
        return _this.get(id).then(function(company){
          redis.hmset('company:'+id, company);
          return company;
        });
      }
      else{
        var Company = dynamoose.model('Company');
        return new Company(company);
      }
  })
  .catch(function(err){
    console.log(err);
    throw err;
  });
};

CompanySchema.statics.findBySlug = function (slug) {
  var _this = this;

  return redis.hgetall('company:slug:'+slug)
    .then(function(val){
      if(_.isEmpty(val)){
        return _this.queryOne('slug').eq(slug).exec().then(function(company){
          redis.hmset('company:slug:'+company.slug, company.id);
          return company.id;
        });
      }
      else{
        console.log('cache hit');
        return val;
      }
  })
  .then(function(companyId){
    var Company = dynamoose.model('Company');
    return Company.getCached(companyId);
  })
  .catch(function(err){
    console.log(err);
    throw err;
  });
};

CompanySchema.statics.getCached = Promise.method(function(id){
  var Company = dynamoose.model('Company');
  var File = dynamoose.model('File');
  var Team = dynamoose.model('Team');
  var key = 'company:' + id;
  var _item;

  return cache.wrap(key, function() {
    console.log('cache miss: company');
    return Company.get(id).then(function(item){
      if(_.isUndefined(item)) return item;
      _item = item;
      return Team.query('companyId').eq(id).exec().then(function(team){
        _item.team = team;
        return _item;
      });
    }).then(function(_item){
      if(_.isUndefined(_item)) return _item;
      if(!_item.banner || !_item.banner.fileId) return _item;

      return File.getCached(_item.banner.fileId).then(function(file){
        _item.banner.file = file;
        return _item;
      });
    }).then(function(){
      return _item;
    });
  });
});

CompanySchema.statics.isMember = Promise.method(function(companyId, userId) {
  var Company = dynamoose.model('Company');
  return Company.getCached(companyId).then(function(val) {
    var index = _.findIndex(val.team, function(t) {
      return t.userId === userId;
    });

    if (index > -1) {
      return true;
    } else {
      return false;
    }
  });
});


CompanySchema.static('createWithSlug', Promise.method(function(body) {
  var Slug = dynamoose.model('Slug');
  var Company = dynamoose.model('Company');
  body.id = intformat(flakeIdGen.next(), 'dec');

  if(body.url){
    var dom = domain(body.url);
    body.domain = dom.domain + '.' + dom.tld;
  }

  return Slug.createWrapper({id: body.slug, refId: body.id, refType: 'Company'}).then(function(slug){
    debug('slug: ', slug);
    return Company.create(body).then(function(item){
      debug('item: ', item);
      return item;
    });
  }).catch(function(err){
    debug('err', err.stack);
    throw err;
  });
}));

CompanySchema.static('purge', Promise.method(function(companyId) {
  if (!companyId) {
    return;
  }

  var Company = dynamoose.model('Company');
  var Slug = dynamoose.model('Slug');
  var Team = dynamoose.model('Team');
  var _item;

  return Company.getCached(companyId).then(function(item) {
    _item = item;
    // delete slug
    return Slug.delete(_item.slug);
  }).then(function() {
    // delete team members
    return Team.batchDelete(_item.team);
  }).then(function() {
    // delete company
    return _item.delete();
  }).catch(function(err){
    debug('err', err.stack);
    throw err;
  });
}));

var model = dynamoose.model('Company', CompanySchema);

/**
 * Hook a pre save method to create the slug
 */
//model.pre('save', function(next) {
//  debug('pre save');
//  var oldSlug = this.slug;
//  if (this.name) {
//    this.slug = slug(this.name);
//  }

//  if(this.url){
//    var dom = domain(this.url);
//    this.domain = dom.domain + '.' + dom.tld;
//  }

//  next();
//});

/**
 * Hook a pre delete method to delete from cache
 * /
Company.pre('delete', function(next) {

  // delete old slug
  if(!_.isUndefined(this.id)){
    redis.del('company:slug:' + this.slug);
    redis.del('company:' + this.id);
  }

  next();
});
*/

