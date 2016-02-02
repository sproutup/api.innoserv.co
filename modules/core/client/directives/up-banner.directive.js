'use strict';
// This directive takes message-variable and fade-out parameters

angular
    .module('tools')
    .directive('upBanner', upBanner);

function upBanner($parse) {
  var directive = {
    restrict: 'A',
    replace: true,
    link: function (scope, element, attrs) {
      setTimeout(function() {
        scope.$apply(function () {
          $parse(attrs.messageVariable).assign(scope.$parent, false);
        });
      }, attrs.fadeOut);
    }
  };

  return directive;
}