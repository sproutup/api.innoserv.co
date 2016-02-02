'use strict';

angular
  .module('core')
  .controller('HomeController', HomeController);

HomeController.$inject = ['$scope', '$state', 'CompanyService', '$http', 'Authentication'];

function HomeController($scope, $state, CompanyService, $http, Authentication) {
  var vm = this;
  // This provides Authentication context.
  vm.authentication = Authentication;
  vm.getStarted = getStarted;
  vm.gotoMyCompany = gotoMyCompany;
  vm.init = true;

  function gotoMyCompany() {
    $state.go('mycompany');
  }

  function getStarted() {
    vm.credentials = {
      email: vm.email,
      company: vm.company
    };

    Authentication.emailSentTo = vm.email;

    $http.post('/api/auth/join', vm.credentials).success(function (response) {
      if (vm.company) {
        $state.go('company.landing.confirmation', { companySlug: vm.company.slug });
      } else {
        $state.go('landing.confirmation');
      }
    }).error(function (response) {
      $scope.error = response.message;
    });
  }
}
