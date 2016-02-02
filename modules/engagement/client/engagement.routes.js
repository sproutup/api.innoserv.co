'use strict';

// Setting up route
angular.module('engagement').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('user.engagement', {
        url: '',
        abstract: true,
        templateUrl: 'modules/engagement/client/engagement.html',
        controller: 'engagementController',
        controllerAs: 'vm'
      })
      .state('user.engagement.page-views', {
        url: '/page-views',
        templateUrl: 'modules/engagement/client/engagement-page-views.html',
        controller: 'engagementController',
        controllerAs: 'vm'
      })
      .state('user.engagement.clicks', {
        url: '/clicks',
        templateUrl: 'modules/engagement/client/engagement-clicks.html',
        controller: 'engagementController',
        controllerAs: 'vm'
      })
      .state('user.engagement.purchases', {
        url: '/purchases',
        templateUrl: 'modules/engagement/client/engagement-purchases.html',
        controller: 'engagementController',
        controllerAs: 'vm'
      });
  }
]);