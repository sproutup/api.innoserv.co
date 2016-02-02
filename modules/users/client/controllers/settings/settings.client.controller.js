'use strict';

angular.module('users').controller('SettingsController', ['$scope', 'Authentication', 'Menus',
  function ($scope, Authentication, Menus) {
    $scope.user = Authentication.user;
    var vm = this;
    vm.user = Authentication.user;

    // Get the topbar menu
    vm.menu = Menus.getMenu('company.user.settings.menu');


  }
]);
