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
  // statuses: -10=template, -5=ended, -1=disapproved, 0=draft, 1=under review, 10=active
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
  disapproved: {
    type: Date
  },
  disapprovedNote: {
    type: String
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

  debug('populate: ', _schema);
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
  debug('looking for ' + key + ' in cache');

  return cache.wrap(key, function() {
    debug('cache miss: ' + key);
    return Campaign.get(id).then(function(item){
      if(_.isUndefined(item)) {
        debug('campaign not found');
        return null;
      }

      _item = item;

      return Promise.join(
        _item.populate('Product'),
        _item.populate('Company')
      ).then(function(){
        if(!_item.banner || !_item.banner.fileId) return _item;

        return File.getCached(_item.banner.fileId).then(function(file){
          _item.banner.file = file;
          return _item;
        });
      });
    });
  });
});

CampaignSchema.statics.queryActive = Promise.method(function(id){
  var Campaign = dynamoose.model('Campaign');
  var key = 'campaign:query:active';
  var _item;

  return cache.wrap(key, function() {
    debug('cache miss: active campaign');
    return Campaign.query('status').eq(10).attributes(['id']).exec()
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
