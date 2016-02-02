'use strict';

angular
  .module('core')
  .directive('upSwitch', upSwitch);

function upSwitch() {
  var directive = {
    restrict: 'EA',
    templateUrl: 'modules/theme/client/directives/up-switch.view.html',
    scope: {
      optionfalse: '@',
      optiontrue: '@',
      selected: '='
    },
    link: linkFunc,
    controller: upSwitchController,
    controllerAs: 'vm',
    bindToController: true // because the scope is isolated
  };

  return directive;

  function linkFunc(scope, el, attr, ctrl) {

  }
}

upSwitchController.$inject = [];

function upSwitchController() {
  var vm = this;
}