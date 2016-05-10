'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var debug = require('debug')('up:debug:campaign:ctrl');
var cache = require('config/lib/cache');
var Campaign = dynamoose.model('Campaign');
var Slug = dynamoose.model('Slug');
var Promise = require('bluebird');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');
var config = require('config/config');
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');

/* const variables */
var _isTemplate = -10;

exports.dropTable = function (req, res) {
  Campaign.$__.table.delete(function (err) {
    if(err) {
      console.log(err);
    }
    delete dynamoose.models.Campaign;
    res.json({result: 'campaign deleted'});
  });
};

/**
 * Show
 */
exports.read = function (req, res) {
  req.model.url = config.domains.mvp + 'campaign/' + req.model.id + '/' + req.model.type;
  res.json(req.model);
};

/**
 * Create
 */
exports.create = function (req, res) {
  var id = intformat(flakeIdGen.next(), 'dec');
  req.body.id = req.body.groupId = id;

  if (req.body.hashtag) {
    Slug.createWrapper({id: req.body.hashtag, refId: req.body.id, refType: 'Campaign'}).then(function() {
      saveCampaign();
    }).catch(function(err) {
      return res.status(400).send(err);
    });
  } else {
    saveCampaign();
  }

  function saveCampaign() {
    var item = new Campaign(req.body);
    item.save(function (err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(item);
      }
    });
  }
};

/**
 * Create Template
 */
exports.createTemplate = function (req, res) {
  var item = new Campaign(req.body);

  item.status = _isTemplate;

  item.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json(item);
    }
  });
};


/**
 * Update
 */
exports.update = function (req, res) {
  var obj = _.omit(req.body, ['id']);
  obj.updated = new Date();

  if (obj.status === 1 && !req.body.hashtag) {
    return res.status(400).send({
      message: 'A hashtag is required to save a campaign'
    });
  }

  // If the hashtag changed, update the slug before update the campaign
  if (req.model.hashtag !== req.body.hashtag) {
    Slug.change({id: req.body.hashtag, refId: req.body.id, refType: 'Campaign'}, req.model.hashtag)
      .then(function() {
        updateCampaign();
      }).catch(function(err) {
        return res.status(400).send(err);
      });
  } else {
    updateCampaign();
  }

  function updateCampaign() {
    Campaign.update({ id: req.model.id }, obj, function (error, campaign) {
      if (error) {
        console.log('error:', error);
        return res.status(400).send({
          message: error
        });
      } else {
        debug('campaign cache del: ', req.model.id);
        cache.del('campaign:' + req.model.id );
        res.json(campaign);
      }
    });
  }
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
  Campaign.queryActive().then(function(campaigns){
    res.json(campaigns);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * List by company
 */
exports.listByCompany = function (req, res) {
  Campaign.query('companyId').eq(req.model.id).where('status').gt(-2).exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * List by product
 */
exports.listByProduct = function (req, res) {
  Campaign.query('productId').eq(req.model.id).exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    console.log('error: ' + err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * List only templates
 */
exports.listTemplate = function (req, res) {
  Campaign.query({status: _isTemplate}).exec().then(function(items){
    res.json(items);
  })
  .catch(function(err){
    console.log(err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};


/**
 * middleware
 */
exports.campaignByID = function (req, res, next, id) {
  if (!_.isString(id)) {
    return res.status(400).send({
      message: 'Campaign is invalid'
    });
  }

  Campaign.getCached(id).then(function(item){
    if(_.isUndefined(item) || !item){
      return res.status(400).send({
        message: 'Campaign not found'
      });
    }

    req.model = item;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};
