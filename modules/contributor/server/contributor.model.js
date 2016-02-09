'use strict';

/**
 * Module dependencies.
 */
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
  userId: {
    type: String,
    hashKey: true
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
  log: [
    {
      created: Date,
      state: Number
    }
  ]
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


