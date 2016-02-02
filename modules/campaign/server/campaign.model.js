'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');



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
      rangeKey: 'id',
      name: 'ProductCampaignIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
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
  start: {
    type: Date
  },
  end: {
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
  }
});

dynamoose.model('Campaign', CampaignSchema);
