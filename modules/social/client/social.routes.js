'use strict';

angular.module('social').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('user.social', {
        url: '',
        abstract: true,
        templateUrl: 'modules/social/client/social.html',
        controller: 'socialController',
        controllerAs: 'vm'
      })
      .state('user.social.impressions', {
        url: '/impressions',
        templateUrl: 'modules/social/client/social-impressions.html',
        controller: 'socialController',
        controllerAs: 'vm'
      })
      .state('user.social.posts', {
        url: '/posts',
        templateUrl: 'modules/social/client/social-posts.html',
        controller: 'socialController',
        controllerAs: 'vm'
      });
  }
]);