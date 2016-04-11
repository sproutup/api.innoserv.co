'use strict';

/**
 * Module dependencies.
 */
 /* global -Promise */
var Promise = require('bluebird');
var _ = require('lodash');
var debug = require('debug')('up:debug:campaign:model');
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');
var cache = require('config/lib/cache');

/**
 * Schema
 */
var CampaignSchema = new Schema({
  id: {
    type: String,
    default: function(){ return intformat(flakeIdGen.next(), 'dec'); },
    hashKey: true
  },
  companyId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'status',
      name: 'CompanyCampaignIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  productId: {
    type: String,
    index: {
      global: true,
      rangeKey: 'status',
      name: 'ProductCampaignIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  groupId: {
    type: String,
    default: function(){ return intformat(flakeIdGen.next(), 'dec'); }
  },
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    default: '',
    trim: true,
  },
  tagline: {
    type: String,
    default: '',
    trim: true,
  },
  hashtag: {
    type: String,
    default: '',
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  instructions: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: Number,
    default: 0,
    required: true,
    index: {
      global: true,
      rangeKey: 'type',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  target: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    default: '',
    trim: true
  },
  updated: {
    type: Date,
    default: Date.now
  },
  started: {
    type: Date
  },
  ended: {
    type: Date
  },
  typeOfContent : {
    type: [String] // yt, tw, ig etc..
  },
  trial: { // trial specific information
    paidContent: Boolean, // Accept request for paid content
    keepProduct: Boolean, // Allow "CERTAIN" (not all) influencers to keep product
    duration: Number // How many days can influencers try the products
  },
  contest: { // contest specific information
    maxNbrOfContributors: Number // Maximum number of entries to be accepted
    // todo define perks/rewards for the contest
  },
  banner: {
    fileId: {
      type: String
    }
  }
});

/**
 * Populate method
 */
CampaignSchema.methods.populate = Promise.method(function (_schema) {
  var _this = this;

  var _attribute = _schema.toLowerCase() + 'Id';
  if (!this[_attribute]) return null;

  console.log('populate: ', _schema);
  var model = dynamoose.model(_schema);
  return model.getCached(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

CampaignSchema.statics.getCached = Promise.method(function(id){
  var Campaign = dynamoose.model('Campaign');
  var File = dynamoose.model('File');
  var key = 'campaign:' + id;
  var _item;

  return cache.wrap(key, function() {
    console.log('cache miss: campaign');
    return Campaign.get(id).then(function(item){
      if(_.isUndefined(item)) return item;
      _item = item;
      return Promise.join(
        _item.populate('Product'),
        _item.populate('Company')
      ).then(function(){
        return _item;
      });
    }).then(function(item){
      if(!item.banner || !item.banner.fileId) return item;

      return File.getCached(item.banner.fileId).then(function(file){
        item.banner.file = file;
        return item;
      });
    }).then(function(item){
      if(!item.company.logo || !item.company.logo.fileId) return item;

      return File.getCached(item.company.logo.fileId).then(function(file){
        item.company.logo.file = file;
        console.log('item.company.logo.file.url is: ', item.company.logo.file.url);
        return item;
      });
    }).then(function(){
      return _item;
    });
  });
});

CampaignSchema.statics.queryActive = Promise.method(function(id){
  var Campaign = dynamoose.model('Campaign');
  var key = 'campaign:query:active';
  var _item;

  return cache.wrap(key, function() {
    console.log('cache miss: active campaign');
    return Campaign.query('status').eq(1).attributes(['id']).exec()
      .then(function(items){
        return Promise.map(items, function(item){
          return Campaign.getCached(item.id);
        });
      }).catch(function(err){
        debug('err', err);
        throw err;
      });
  });
});

dynamoose.model('Campaign', CampaignSchema);
