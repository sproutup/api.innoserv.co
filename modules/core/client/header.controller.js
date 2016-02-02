'use strict';

angular.module('core').controller('HeaderController', ['$scope', '$state', 'Authentication', 'Menus', 'TeamService', 'CompanyService', '$cookieStore',
  function ($scope, $state, Authentication, Menus, TeamService, CompanyService, $cookieStore) {
    var vm = this;
    vm.toggleCollapsibleMenu = toggleCollapsibleMenu;
    // Expose view variables
    vm.$state = $state;
    vm.authentication = Authentication;
    vm.isCollapsed = false;
    // Get the navbar menu
    vm.navbar = Menus.getMenu('navbar');
    // $scope.myCompanies = TeamService.listByUser().query({
    //   userId: Authentication.user.id
    // }, function() {
    //   console.log($scope.myCompanies);
    //   Authentication.user.sessionCompany = $scope.myCompanies[0];
    // });

 //   $scope.companies = CompanyService.company().query();

    // Toggle the menu items
    function toggleCollapsibleMenu() {
      vm.isCollapsed = !vm.isCollapsed;
    }

    //var sessionCompany = $cookieStore.get('sessionCompany');
/*    if (Authentication.user) {
      $scope.company = $scope.companies[0];
      Authentication.user.sessionCompany = $scope.companies[0];
    } else {
      console.log('you need to select a company');
      $state.go('user.companies');
    }
*/
    // Collapsing the menu after navigation
    $scope.$on('$stateChangeSuccess', function () {
      vm.isCollapsed = false;
    });
  }
]);
