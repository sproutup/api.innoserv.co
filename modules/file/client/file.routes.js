'use strict';

angular.module('file').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('company.navbar.file', {
        url: '/file',
        abstract: true,
        template: '<div ui-view></div>',
        controller: 'FileController',
        controllerAs: 'vm'
      })
      .state('company.navbar.file.list', {
        url: 's',
        templateUrl: 'modules/file/client/list.html'
      })
     .state('company.navbar.file.create', {
        url: '/create',
        templateUrl: 'modules/file/client/create.html'
      })
      .state('company.navbar.file.view', {
        url: '/:fileId',
        templateUrl: 'modules/file/client/file.html'
      })
      .state('company.navbar.file.edit', {
        url: '/:fileId/edit',
        templateUrl: 'modules/file/client/edit.html'
      });
  }
]);
