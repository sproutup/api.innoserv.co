'use strict';

angular.module('community').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('user.community', {
        url: '',
        abstract: true,
        templateUrl: 'modules/community/client/community.html',
        controller: 'communityController',
        controllerAs: 'vm'
      })
      .state('user.community.requests', {
        url: '/requests',
        templateUrl: 'modules/community/client/community-requests.html',
        controller: 'communityController',
        controllerAs: 'vm'
      })
      .state('user.community.trials', {
        url: '/trials',
        templateUrl: 'modules/community/client/community-trials.html',
        controller: 'communityController',
        controllerAs: 'vm'
      })
      .state('user.community.ambassadors', {
        url: '/ambassadors',
        templateUrl: 'modules/community/client/community-ambassadors.html',
        controller: 'communityController',
        controllerAs: 'vm'
      });
  }
]);