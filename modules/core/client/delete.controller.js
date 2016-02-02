(function () {
  'use strict';

  angular
    .module('core')
    .controller('DeleteController', DeleteController);

  function DeleteController($scope, $modalInstance, message) {
    var vm = this;
    vm.message = message;

    vm.confirm = function() {
      $modalInstance.close('disconnected');
    };

    vm.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  }

})();