'use strict';

(function() {

  angular
    .module('product')
    .controller('ProductController', ProductController);

  ProductController.$inject = ['$scope', 'TrialService', '$state', 'ProductService', '$location', 'Authentication', 'TeamService', '$rootScope', '$modal'];

  function ProductController($scope, TrialService, $state, ProductService, $location, Authentication, TeamService, $rootScope, $modal) {
    var vm = this;
    vm.create = create;
    vm.remove = remove;
    vm.update = update;
    vm.cancel = cancel;
    vm.find = find;
    vm.findOne = findOne;
    vm.editProduct = editProduct;
    vm.startCampaign = startCampaign;
    vm.openModal = openModal;

    function create(isValid) {
      vm.error = null;

      if (!isValid) {
        vm.invalid = true;
        $scope.$broadcast('show-errors-check-validity', 'productForm');

        return false;
      } else {
        vm.invalid = false;
      }

      // Create new product object
      var Product = ProductService.products();
      var item = new Product({
        companyId: $scope.company.company.id,
        name: vm.name,
        description: vm.description,
        tagline: vm.tagline
      });

      // Redirect after save
      item.$save(function (response) {
        $state.go('company.navbar.product.list');

        // Clear form fields
        vm.description = '';
      }, function (errorResponse) {
        console.log(errorResponse);
        vm.error = errorResponse.data.message;
      });
    }

    function remove(product) {
      if (product) {
        product.$remove({
          productId: product.id
        }, function() {
          $state.go('company.navbar.product.list');
        });

        for (var i in vm.companies) {
          if (vm.companies[i] === product) {
            vm.companies.splice(i, 1);
          }
        }
      } 
      // else {
        // test this 
        // vm.product.$remove(function () {
        //   $location.path('user.product');
        // });
      // }
    }

    function update(isValid) {
      vm.error = null;

      if (!isValid) {
        vm.invalid = true;
        $scope.$broadcast('show-errors-check-validity', 'articleForm');

        return false;
      } else {
        vm.invalid = false;
      }

      var product = vm.product;

      product.$update({
        productId: $state.params.productId
      }, function () {
        $state.go('company.navbar.product.list');
      }, function (errorResponse) {
        vm.success = null;
        vm.error = errorResponse.data.message;
      });
    }

    function cancel() {
      $location.path('products');
    }

    function find() {
      if ($scope.company.company.id) {
        makeCall();
      } else {
        $scope.$watch('company.company.id', function(val) {
          if(val) makeCall();
        });
      }

      function makeCall() {
        vm.products = ProductService.listByCompany().query({
          companyId: $scope.company.company.id
        }, function() {
          console.log('products found');
        }, function(err) {
          console.log(err);
        });
      }
    }

    function findOne() {
      vm.success = false;

      var product = ProductService.products().get({
        productId: $state.params.productId
      }, function() {
        vm.product = product;
      }, function(err) {
        $state.go('landing.default');
      });
    }

    function editProduct() {
      $state.go('company.navbar.product.edit', { productId: $state.params.productId });
    }

    function startCampaign(product) {
      $rootScope.startingCampaign = product;
    }

    function openModal(item) {
      var modalInstance = $modal.open({
        templateUrl: 'modules/core/client/delete-confirmation.html',
        controller: 'DeleteController',
        controllerAs: 'vm',
        resolve: {
          message: function() { return 'This product will be gone forever.'; }
        }
      });

      modalInstance.result.then(function () {
        remove(item);
      }, function () {
        console.log('Modal dismissed at: ' + new Date());
      });
    }
  }
})();
