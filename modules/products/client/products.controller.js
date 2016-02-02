'use strict';

// Products controller
angular.module('products').controller('ProductsController', ['$scope', '$stateParams', '$location', 'Authentication', 'Products',
  function ($scope, $stateParams, $location, Authentication, Products) {
    $scope.authentication = Authentication;

    // Create new Product
    $scope.create = function () {
      // Create new Article object
      var product = new Products({
        title: this.title,
        tagline: this.tagline
      });

      // Redirect after save
      product.$save(function (response) {
        $location.path('products/' + response._id);

        // Clear form fields
        $scope.title = '';
        $scope.tagline = '';
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Remove existing Article
    $scope.remove = function (article) {
      if (article) {
        article.$remove();

        for (var i in $scope.articles) {
          if ($scope.articles[i] === article) {
            $scope.articles.splice(i, 1);
          }
        }
      } else {
        $scope.article.$remove(function () {
          $location.path('articles');
        });
      }
    };

    // Update existing Article
    $scope.update = function () {
      var article = $scope.article;

      article.$update(function () {
        $location.path('articles/' + article._id);
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };

    // Find a list
    $scope.find = function () {
      $scope.products = Products.query();
    };

    // Find existing
    $scope.findOne = function () {
      $scope.product = Products.get({
        productId: $stateParams.productId
      });
    };
  }
]);
