'use strict';

angular.module('company').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('company', {
        url: '/com/:companySlug',
        abstract: true,
        template: '<section ng-init="company.findByStateParam()"><div ui-view></div></section>',
        controller: 'CompanyController',
        controllerAs: 'company'
      })
      .state('company.navbar.list', {
        url: '/select',
        templateUrl: 'modules/company/client/company-settings.html',
        controller: 'CompanyController',
        controllerAs: 'vm',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('mycompany', {
        url: '/mycompany',
        template: '<div ng-init="vm.findMyCompany()"></div>',
        controller: 'CompanyController',
        controllerAs: 'vm',
        data: {
          roles: ['user', 'admin']
        }
      })
     .state('company.navbar.company.create', {
        url: '/create',
        templateUrl: 'modules/company/client/admin/create-company.html'
      })
      .state('company.navbar.settings', {
        url: '/settings',
        abstract: true,
        templateUrl: 'modules/company/client/settings/settings.html',
      })
      .state('company.navbar.settings.profile', {
        url: '',
        templateUrl: 'modules/company/client/settings/edit-company-profile.html'
      })
      // for internal admin 
      .state('admincompany', {
        url: '/admin/company',
        abstract: true,
        template: '<section class="content"><section class="container"><div ui-view></div></section></section>',
        controller: 'CompanyController',
        controllerAs: 'vm'
      })
      .state('admincompany.list', {
        url: '',
        templateUrl: 'modules/company/client/admin/list-companies.html'
      })
      .state('admincompany.edit', {
        url: '/:companyId/edit',
        templateUrl: 'modules/company/client/admin/edit-company.html'
      })
      .state('admincompany.view', {
        url: '/:companyId',
        templateUrl: 'modules/company/client/admin/view-company.html'
      });
  }
]);
