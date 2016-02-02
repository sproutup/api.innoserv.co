'use strict';

angular.module('settings').config(['$stateProvider',
  function ($stateProvider) {
    $stateProvider
      .state('subscribe', {
        url: '/subscribe',
        templateUrl: 'modules/settings/client/subscribe.html'
      });
  }
]);