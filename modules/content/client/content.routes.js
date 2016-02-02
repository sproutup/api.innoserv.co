'use strict';

angular.module('content').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('user.content', {
        url: '/content',
        // abstract: true,
        templateUrl: 'modules/content/client/content.html',
        controller: 'contentController',
        controllerAs: 'vm'
      });
      // .state('user.content.videos', {
      //   url: '/videos',
      //   templateUrl: 'modules/content/client/content-videos.html',
      //   controller: 'contentController',
      //   controllerAs: 'vm'
      // })
      // .state('user.content.blogs', {
      //   url: '/blogs',
      //   templateUrl: 'modules/content/client/content-blogs.html',
      //   controller: 'contentController',
      //   controllerAs: 'vm'
      // });
  }
]);