'use strict';

/**
 * Module dependencies.
 */
var Calendar = require('./calendar.service');
var errorHandler = require('modules/core/server/errors.controller');
var _ = require('lodash');
var config = require('config/config');
var redis = require('config/lib/redis');

/**
 * Create an event
 */
exports.createEvent = function (req, res) {
  Calendar.insertEvent(config.google.calendar.id, req.body)
    .then(function(result) {
      res.json(result);
    })
    .catch(function(err) {
      console.log('err', err);
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
    });
};

/**
 * List of events
 */
exports.listEvents = function (req, res) {
  redis.get('calendarID:' + config.google.calendar.id).then(function(events) {
    if (events) {
      res.json(JSON.parse(events));
    } else {
      Calendar.listEvents(config.google.calendar.id)
        .then(function(result) {
          redis.setex('calendarID:' + config.google.calendar.id, 500, JSON.stringify(result));
          res.json(result);
        })
        .catch(function(err) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
        });
    }
  });
};

/**
 * Get an event
 */
exports.getEvent = function (req, res) {
  Calendar.getEvent(config.google.calendar.id, req.params.eventId)
    .then(function(result) {
      res.json(result);
    })
    .catch(function(err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
    });
};

/**
 * Update an event
 */
exports.updateEvent = function (req, res) {
  Calendar.updateEvent(config.google.calendar.id, req.body.resource)
    .then(function(result) {
      res.json(result[0]);
    })
    .catch(function(err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
    });
};

/**
 * Delete an event
 */
exports.deleteEvent = function (req, res) {
  Calendar.deleteEvent(config.google.calendar.id, req.params.eventId)
    .then(function(result) {
      res.json({ message: 'success' });
    })
    .catch(function(err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
    });
};
