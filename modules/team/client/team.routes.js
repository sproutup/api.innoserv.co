'use strict';

angular.module('team').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('company.navbar.settings.team', {
        url: '/team',
        abstract: true,
        template: '<ui-view/>',
        controller: 'TeamController',
        controllerAs: 'vm'
      })
      .state('company.navbar.settings.team.list', {
        url: '/members',
        templateUrl: 'modules/team/client/list-team.view.html'
      })
      .state('company.navbar.settings.team.create', {
        url: '/create',
        templateUrl: 'modules/team/client/create-team.view.html'
      })
      .state('company.navbar.settings.team.edit', {
        url: '/:teamId/edit',
        templateUrl: 'modules/team/client/edit-team.view.html'
      })
      .state('company.navbar.settings.team.view', {
        url: '/:teamId',
        templateUrl: 'modules/team/client/view-team.view.html'
      });
  }
]);

