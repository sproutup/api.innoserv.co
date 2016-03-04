'use strict';

var policy = require('./scrapper.policy');
var ctrl = require('./scrapper.controller');

module.exports = function (app) {
  app.route('/api/meta')
    .post(ctrl.getMeta);

};
