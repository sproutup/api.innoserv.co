'use strict';

angular
  .module('core')
  .directive('uniqueEmail', EmailDirective);

EmailDirective.$inject = ['$q', '$timeout', '$http'];

function EmailDirective($q, $timeout, $http) {
  var directive = {
    require: 'ngModel',
    link: linkFunc,
  };

  return directive;

  function linkFunc(scope, el, attr, ctrl) {
    console.log('attr:', attr.uniqueEmail);
    ctrl.$asyncValidators.uniqueemail = function(modelValue, viewValue) {
      if (ctrl.$isEmpty(modelValue)) {
        // consider empty model valid
        return $q.when();
      }

      var def = $q.defer();
      var email = modelValue;

      if(attr.uniqueEmail) {
        console.log('email domain: ', attr.uniqueEmail);
        email = email + '@' + attr.uniqueEmail;
      }
      else{
        scope.vm.domain = email.substring(email.lastIndexOf('@')+1, email.length);
      }

      $http.post('/api/auth/validate/email', {email: email}).success(function (response) {
        if(response.result === 1){
          scope.vm.company = response.company;
          def.resolve();
        }
        else{
          def.reject();
        }
      }).error(function (response) {
        def.reject();
      });

      return def.promise;
    };
  }
}


