'use strict';

(function() {

  angular
    .module('landing')
    .controller('landingController', landingController);

landingController.$inject = ['$scope', '$state', '$location', 'CompanyService', '$http', 'Authentication'];

function landingController($scope, $state, $location, CompanyService, $http, Authentication) {
  var vm = this;
  vm.authentication = Authentication;
  vm.getStarted = getStarted;

  function getStarted() {
    var userEmail = String(vm.email + '@' + $scope.company.company.domain);

    vm.credentials = {
      email: userEmail,
      company: $scope.company.company
    };

    Authentication.emailSentTo = userEmail;

    $http.post('/api/auth/join', vm.credentials).success(function (response) {
      $state.go('company.landing.confirmation');
    }).error(function (response) {
      $scope.error = response.message;
    });
  }
}

})();
