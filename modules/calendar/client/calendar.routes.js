'use strict';

angular.module('calendar').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('company.navbar.calendar', {
        url: '/calendar',
        abstract: true,
        template: '<div ui-view></div>',
        controller: 'CalendarController',
        controllerAs: 'calendar'
      })
      .state('company.navbar.calendar.event', {
        url: '/event',
        abstract: true,
        template: '<div ui-view></div>',
        controller: 'EventController',
        controllerAs: 'vm'
      })
      .state('company.navbar.calendar.event.list', {
        url: 's',
        templateUrl: 'modules/calendar/client/list-event.view.html'
      })
      .state('company.navbar.calendar.event.create', {
        url: '/create',
        templateUrl: 'modules/calendar/client/create-event.view.html'
      })
      .state('company.navbar.calendar.event.view', {
        url: '/:eventId',
        templateUrl: 'modules/calendar/client/event.view.html'
      })
      .state('company.navbar.calendar.event.edit', {
        url: '/:eventId/edit',
        templateUrl: 'modules/calendar/client/edit-event.view.html'
      });
  }
]);