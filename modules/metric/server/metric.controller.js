'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var Metric = dynamoose.model('Metric');
var elasticsearch = require('config/lib/elasticsearch');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');

/**
 * Show
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Create
 */
exports.create = function (req, res) {
  var item = new Metric(req.body);

  item.save().then(function(val){
    return res.json(item);
  }).catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Update
 */
exports.update = function (req, res) {
  var item = req.model;

  //For security purposes only merge these parameters
  item.name = req.body.name;
  item.url = req.body.url;
  item.tagline = req.body.tagline;
  item.description = req.body.description;
  item.video = req.body.video;

  item.save().then(function(data){
    res.json(item);
  })
  .catch(function (err) {
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Delete
 */
exports.delete = function (req, res) {
  var item = req.model;

  item.delete().then(function(result){
    res.json(item);
  })
  .catch(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  });
};

/**
 * List
 */
exports.list = function (req, res) {
  Metric.scan().exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Query
 */
exports.query = function (req, res) {
  var query = {
    index: 'metric',
    type: 'views',
    searchType: 'count',
    body: {
      'aggs' : {
        'results' : {
          'filter' : {
            'bool' : {
              'must' : []
            }
          },
          'aggs' : {
            'views_per_day' : {
              'date_histogram' : {
                'field' : 'timestamp',
                'interval' : 'month',
                'format': 'yyyy-MM-dd',
                'min_doc_count': 0
              },
              'aggs': {
                'sum': {
                  'sum': {
                    'field': 'value'
                  }
                },
                'cumulative': {
                  'cumulative_sum': {
                    'buckets_path': 'sum'
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  if(req.body.metric){
    query.type = req.body.metric;
//    query.body.aggs.results.filter.bool.must.push({'term': { 'name': req.body.metric }});
  }
  if(req.body.dimension){
    if(req.body.dimension!=='day'){
      // do something
      console.log('dimension: ' + req.body.dimension);
    }
  }

  if(req.body.userId){
    query.body.aggs.results.filter.bool.must.push({'term': { 'userId': req.body.userId }});
  }
  if(req.body.contentId){
    query.body.aggs.results.filter.bool.must.push({'term': { 'contentId': req.body.contentId }});
  }
  if(req.body.campaignId){
    query.body.aggs.results.filter.bool.must.push({'term': { 'campaignId': req.body.campaignId }});
  }
  if(req.body.companyId){
    query.body.aggs.results.filter.bool.must.push({'term': { 'companyId': req.body.companyId }});
  }


  elasticsearch.search(query).then(function(items){
    res.json(items.aggregations.results);
  }).catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * middleware
 */
exports.findByID = function (req, res, next, id) {
  if (!_.isString(id)) {
    return res.status(400).send({
      message: 'Service is invalid'
    });
  }

  Metric.get(id).then(function(item){
    console.log(item);
    if(_.isUndefined(item)){
      return res.status(400).send({
        message: 'Service not found'
      });
    }

    req.model = item;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};
