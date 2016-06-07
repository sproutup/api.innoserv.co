'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var Promise = require('bluebird');
var cache = require('config/lib/cache');
var moment = require('moment');
var debug = require('debug')('up:debug:content:model');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');

/**
 * Schema
 */
var ContentSchema = new Schema({
  id: {
    type: String,
    default: function(){ return intformat(flakeIdGen.next(), 'dec'); },
    hashKey: true
  },
  // unique id from source media
  ref: {
    type: String
  },
  // tw, ig, yt, pi etc...
  media: {
    type: String,
    trim: true,
    required: true,
    index: {
      global: true,
      rangeKey: 'ref',
      name: 'ContentMediaRefIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  userId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'media',
      name: 'ContentUserMediaIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  campaignId: {
    type: String,
    required: false,
    index: {
      global: true,
      rangeKey: 'userId',
      name: 'ContentCampaignUserIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  created: {
    type: Date,
    default: Date.now
  },
  timestamp: {
    type: Number,
    required: true,
    default: moment().utc().unix()
  },
  status: {
    type: Number,
    default: 1,
    required: true,
    index: {
      global: true,
      rangeKey: 'timestamp',
      name: 'ContemtStatusTimestampIndex',
      project: true, // ProjectionType: ALL
      throughput: 1 // read and write are both 1
    }
  },
  title: {
    type: String,
    default: '',
    trim: true,
    required: true
  }
});

ContentSchema.static('processOldestContent', function() {
  var _this = this;
  var time = moment().utc().startOf('day').unix();
//  var time = moment().utc().startOf('minute').unix();
  return _this.queryOne('status').eq(1).ascending().where('timestamp').lt(time).exec().then(function(val){
    if(val){
      debug('updating content ' +  val.media + ' : ' + val.id);
      return _this.update({id: val.id}, {timestamp: time}).then(function(val){
        return val.fetchMetrics().then(function(metric) {
          debug('metrics updated');
          return metric;
        });
      });
    }
    else{
      return null;
    }
  }).catch(function(err){
    debug(err);
    return err;
  });
});

ContentSchema.methods.fetchMetrics = Promise.method(function() {
  var Provider = dynamoose.model('Provider');
  var Service = dynamoose.model('Service');
  var _this = this;
  var key = 'content:metrics:' + _this.media + ':id:' + _this.id;

  return cache.wrap(key, function() {
    if(_this.status !== 1 && false){
      console.log('Provider is not connected');
      return 0;
    }

    debug('refresh metrics for ' + _this.id);

    switch(_this.media){
      case 'twitter':
        return Service.refresh(_this.provider, _this.data.token, _this.userId, _this.data.tokenSecret);
      case 'yt':
        return Service.get({id: _this.userId, service: 'youtube'}).then(function(val){
          debug('found service: ' + val.id);
          return val.getYoutubeMetrics(_this.ref);
        });
      case 'google':
        return _this.getAccessToken().then(function(accessToken){
          return Promise.join(
            Service.refresh('youtube', accessToken, _this.userId),
            Service.refresh('googleplus', accessToken, _this.userId)
  //          Service.refresh('googleanalytics', accessToken, _this.userId)
          );
        });
      default:
        return null;
        //return Service.refresh(_this.provider, _this.data.accessToken, _this.userId);
    }
  },{ttl: 60});
});


/**
 * Populate method for posts
 */
ContentSchema.method('populate', function (_schema, _id) {
  var _this = this;
  var _attribute = _schema.toLowerCase() + 'Id';
  console.log('populate: ', _schema);
  var model = dynamoose.model(_schema);
  return model.get(this[_attribute]).then(function(item){
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

dynamoose.model('Content', ContentSchema);

