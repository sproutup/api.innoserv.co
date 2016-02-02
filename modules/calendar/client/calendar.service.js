'use strict';

angular
    .module('calendar')
    .factory('CalendarService', CalendarService);

CalendarService.$inject = ['$resource'];

function CalendarService($resource) {
  var service = {
    events: events
  };

  return service;

  function events () {
     return $resource('/api/calendar/event/:eventId', { eventId: '@id' }, { 'update': {method:'PUT'}, 'query': {method:'GET', isArray:true} } );
  }
}