'use strict';

var knex = require('config/lib/knex').knex;
var _ = require('lodash');

function Base() {
  this.x = 0;
  this.y = 0;
}

Base.table = '';

Base.findGreaterThan = function(id){
  console.log('find > ', id);
  return knex.select('id').from(this.table)
    .where('id', '>', id)
    .orderBy('id', 'asc')
    .limit(100)
    .then(function(rows) {
      return _.pluck(rows, 'id');
    });
};


