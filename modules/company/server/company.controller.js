'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose');
var Company = dynamoose.model('Company');
var Team = dynamoose.model('Team');
 /* global -File */
var File = dynamoose.model('File');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');

/**
 * Show the company
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Create
 */
exports.create = function (req, res) {
  var _item;
  Company.createWithSlug(req.body)
    .then(function(item) {
      _item = item;
      return Team.addTeamMember(req.user.id, _item.id);
    }).then(function(member) {
      _item.team = [];
      _item.team.push(member);
      res.json(_item);
    }).catch(function(error) {
      return res.status(400).send(error);
    });
};

/**
 * Update
 */
exports.update = function (req, res) {
  var obj = _.omit(req.body, ['id']);

  Company.update({ id: req.model.id }, obj, function (error, company) {
    if (error) {
      console.log('error:', error);
      return res.status(400).send({
        message: error
      });
    } else {
      if (company.banner && company.banner.fileId) {
        File.getCached(company.banner.fileId).then(function(file){
          company.banner.file = file;
          res.json(company);
        });
      } else {
        res.json(company);
      }
    }
  });
};

/**
 * Delete a company
 */
exports.delete = function (req, res) {
  var company = req.model;

  company.delete().then(function(result){
    res.json(company);
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
 * List of Companies
 */
exports.list = function (req, res) {
  Company.scan().exec().then(function(companies){
    res.json(companies);
  })
  .catch(function(err){
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Company middleware
 */
exports.companyByID = function (req, res, next, id) {
  if (!_.isString(id)) {
    return res.status(400).send({
      message: 'Company is invalid'
    });
  }

  Company.getCached(id).then(function(company){
    if(_.isUndefined(company)){
      return res.status(400).send({
        message: 'Company not found'
      });
    }

    req.model = company;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};

exports.companyBySlug = function (req, res, next, slug) {
  if (!_.isString(slug)) {
    return res.status(400).send({
      message: 'Company is invalid'
    });
  }

  Company.findBySlug(slug).then(function(company){
    if(_.isUndefined(company)){
      return res.status(400).send({
        message: 'Company not found'
      });
    }

    req.model = company;
    next();
  })
  .catch(function(err){
    return next(err);
  });
};

/**
 * Update banner picture
 */
exports.changeBannerPicture = function (req, res) {
  var changePicture = changePicture;

  Company.isMember(req.body.companyId, req.user.id).then(function(isMember) {
    if (isMember) {
      changePicture();
    } else {
      return res.status(401).send({
        message: 'You\'re not authorized to change the picture'
      });
    }
  });

  changePicture = function() {
    Company.update({id: req.body.companyId}, {banner:{fileId: req.body.fileId}}, function (error, company) {
      if (error) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(error)
        });
      } else {
        res.json(company);
      }
    });
  };
};
