'use strict';

angular.module('product').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('company.navbar.product', {
        url: '/product',
        abstract: true,
        template: '<div ui-view></div>',
        controller: 'ProductController',
        controllerAs: 'vm'
      })
      .state('company.navbar.product.list', {
        url: '/list',
        templateUrl: 'modules/product/client/list-products.html'
      })
      .state('company.navbar.product.create', {
        url: '/create',
        templateUrl: 'modules/product/client/create-product.html'
      })
      .state('company.navbar.product.view', {
        url: '/:productId',
        templateUrl: 'modules/product/client/product.html'
      })
      //edit product and mock
      .state('company.navbar.product.edit', {
        url: '/:productId/edit',
        templateUrl: 'modules/product/client/edit-product.html'
      });
  }
]);
