'use strict';

/**
 * Module dependencies.
 */
/* global -Promise */
var Promise = require('bluebird');
var _ = require('lodash');
var debug = require('debug')('up:debug:post:model');
var cache = require('config/lib/cache');
var dynamoose = require('dynamoose');
var Schema = dynamoose.Schema;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var validator = require('validator');

/**
 * Schema
 */
var PostSchema = new Schema({
  id: {
    type: String,
    default: function(){ return intformat(flakeIdGen.next(), 'dec'); },
    hashKey: true
  },
  userId: {
    type: String,
    required: true,
    index: {
      global: true,
      rangeKey: 'created',
      name: 'PostUserIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  groupId: {
    type: String,
    required: false,
    index: {
      global: true,
      rangeKey: 'created',
      name: 'PostGroupIdCreatedIndex',
      project: true, // ProjectionType: ALL
      throughput: 5 // read and write are both 5
    }
  },
  created: {
    type: Date,
    default: Date.now
  },
  type: {
    type: Number,
    default: 0 // 0 = post, 1 = suggestion, 2 = campaign content, 3 = video, 4 = picture
  },
  body: {
    type: String,
    default: '',
    trim: true,
    required: true
  },
  refId: {
    type: String,
    required: false
  },
  refType: {
    type: String,
    required: false
  },
  meta: {},
  url: {
    type: String
  }
});

/**
 * Populate method
 */
PostSchema.methods.populate = Promise.method(function (_schema) {
  var _this = this;

  var _attribute = _schema.toLowerCase() + 'Id';
  if (!this[_attribute]) return null;

  debug('populate: ', _schema, ' Attr: ', this[_attribute]);
  var model = dynamoose.model(_schema);
  return model.getCached(this[_attribute]).then(function(item){
    if(_.isUndefined(item)) return _this;
    _this[_schema.toLowerCase().trim()] = item;
    return _this;
  });
});

/**
 *
 **/
PostSchema.statics.getCached = Promise.method(function(id){
  var Post = dynamoose.model('Post');
  var key = 'post:' + id;
  var _item;

  return cache.wrap(key, function() {
    debug('cache miss: ', key);
    return Post.get(id).then(function(post){
      if(_.isUndefined(post)) return null;
      _item = post;
      return Promise.join(
        post.populate('User'),
        post.populateRef('Comment'),
        post.populateRef('Likes'),
        function(user, comment, likes){
          return _item;
        });
    });
  });
});

/**
 * Populate method for posts
 */
PostSchema.method('populateRef', function (_schema, _id) {
  var _this = this;
  debug('populateRef: ', _schema);
  var model = dynamoose.model(_schema);
  return model.query('refId').eq(this.id).exec().then(function(items){
    _this[_schema.toLowerCase().trim()] = items;
    return _this;
  });
});

dynamoose.model('Post', PostSchema);
