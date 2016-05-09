'use strict';

/**
 * Module dependencies.
 */
 /* global -Promise */
var Promise = require('bluebird');
var _ = require('lodash');
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');

/**
 * Schema
 */
var ContributorSchema = new Schema({
  id: {
    type: String,
    default: function(){ return intformat(flakeIdGen.next(), 'dec'); },
    hashKey: true
  },
  userId: {
    type: String,
    index: {
      global: true,
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  campaignId: {
    type: String,
    rangeKey: true,
    required: true,
    index: {
      global: true,
      rangeKey: 'userId',
      name: 'ContributorCampaignIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  created: {
    type: Date,
    default: Date.now
  },
  // states: 0=requested, 1=approved, -1=rejected, -2=cancelled
  state: {
    type: Number,
    default: 0
  },
  link: {
    type: String
  },
  address: {
    type: String
  },
  phone: {
    type: String
  },
  comment: {
    type: String
  },
  bid: {
    type: Number
  },
  recommended: {
    type: Number
  },
  note: {
    type: String
  },
  log: [
    {
      created: Date,
      state: Number
    }
  ],
  trial: { // trial specific information
    shippingDate: Date,
    shippingState: Number
  }
});

/**
 * Populate method
 */
ContributorSchema.methods.populate = Promise.method(function (_schema) {
  var _this = this;

  var _attribute = _schema.toLowerCase() + 'Id';
  if (!this[_attribute]){
    console.log('populate: null value');
    return null;
  }

  console.log('populate: ', _schema);
  var model = dynamoose.model(_schema);
  return model.getCached(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

/**
 * Populate method
 */
ContributorSchema.statics.updateState = Promise.method(function (campaignId, userId, state) {
  var _item;
  var _previousState;

  return Contributor.queryOne('campaignId').eq(campaignId).where('userId').eq(userId).exec()
    .then(function(item){
      if(_.isUndefined(item)){
        throw 'Contributor not found.';
      }
      _previousState = item.state;

      return item;
  })
  .then(function(item){
    if (state === item.state) {
      return item;
    }

    _item = item;
    _item.state = state;
    return item.save();
  }).catch(function (err) {
    throw 'Something went wrong while we updated your request status';
  });
});

var Contributor = dynamoose.model('Contributor', ContributorSchema);

/**
 * Hook a pre save method
 */
Contributor.pre('save', function(next) {
  if (this.state) {
    if(_.isUndefined(this.log)){
      this.log = [{state: this.state, created: Date.now()}];
    }
    else{
      var latest = _.max(this.log, function(o) { return o.created; });
      if(latest.state !== this.state){
        this.log.push({state: this.state, created: Date.now()});
      }
    }
  }

  next();
});
