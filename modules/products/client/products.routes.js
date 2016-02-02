'use strict';

// Setting up route
angular.module('products').config(['$stateProvider',
  function ($stateProvider) {
    // Products state routing
    $stateProvider
      .state('products', {
        abstract: true,
        url: '/product2',
        template: '<ui-view/>'
      })
      .state('products.list', {
        url: '',
        templateUrl: 'modules/products/client/list-products.view.html'
      })
      .state('products.create', {
        url: '/create',
        templateUrl: 'modules/products/client/create-product.view.html',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('products.view', {
        url: '/:productId',
        templateUrl: 'modules/products/client/view-product.view.html'
      })
      .state('products.edit', {
        url: '/:productId/edit',
        templateUrl: 'modules/products/client/edit-product.view.html',
        data: {
          roles: ['user', 'admin']
        }
      });
  }
]);
