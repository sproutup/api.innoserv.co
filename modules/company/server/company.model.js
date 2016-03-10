'use strict';

/**
 * Module dependencies.
 */
 /* global -Promise */
var Promise = require('bluebird');
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var _ = require('lodash');
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
        item.team = team;
        return item;
      });
    }).then(function(item){
      if(!item.banner || !item.banner.fileId) return item;

      return File.get(item.banner.fileId).then(function(file){
        item.banner.file = file;
        return item;
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


var Company = dynamoose.model('Company', CompanySchema);

/**
 * Hook a pre save method to create the slug
 */
Company.pre('save', function(next) {
  var oldSlug = this.slug;
  if (this.name) {
    this.slug = slug(this.name);
  }

  if(this.url){
    var dom = domain(this.url);
    this.domain = dom.domain + '.' + dom.tld;
  }

  // delete old slug
  if(!_.isUndefined(this.id)){
    redis.del('company:slug:' + oldSlug);
    redis.del('company:' + this.id);
  }

  next();
});

/**
 * Hook a pre delete method to delete from cache
 */
Company.pre('delete', function(next) {

  // delete old slug
  if(!_.isUndefined(this.id)){
    redis.del('company:slug:' + this.slug);
    redis.del('company:' + this.id);
  }

  next();
});

