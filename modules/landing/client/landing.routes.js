'use strict';

// Setting up route
angular.module('landing').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('company.landing', {
        url: '/landing',
        abstract: true,
        template: '<div ui-view></div>',
        controller: 'landingController',
        controllerAs: 'vm'
      })
      .state('landing', {
        url: '/landing',
        abstract: true,
        template: '<div ui-view></div>',
        controller: 'landingController',
        controllerAs: 'vm'
      })
      .state('company.landing.default', {
        url: '',
        templateUrl: 'modules/landing/client/landing.view.html'
      })
      .state('landing.confirmation', {
        url: '/confirmation',
        templateUrl: 'modules/landing/client/landing-confirmation.view.html'
      })
      .state('company.landing.confirmation', {
        url: '/confirmation',
        templateUrl: 'modules/landing/client/landing-confirmation.view.html'
      });
  }
]);
