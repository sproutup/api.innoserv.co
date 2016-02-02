'use strict';

angular
  .module('core')
  .directive('upMultiSwitch', upMultiSwitch);

function upMultiSwitch() {
  var directive = {
    restrict: 'EA',
    templateUrl: 'modules/theme/client/directives/up-multi-switch.view.html',
    scope: {
      options: '='
    },
    link: linkFunc,
    controller: upMultiSwitchController,
    controllerAs: 'vm',
    bindToController: true // because the scope is isolated
  };

  return directive;

  function linkFunc(scope, el, attr, ctrl) {
    console.log(scope);
  }
}

upMultiSwitchController.$inject = [];

function upMultiSwitchController() {
  var vm = this;
  vm.toggleOption = function(item) {
    if (!item.selected) {
      item.selected = true;
    } else {
      item.selected = false;
    }
  };
}