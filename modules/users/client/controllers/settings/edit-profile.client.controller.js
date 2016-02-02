'use strict';

angular.module('users').controller('EditProfileController', ['$scope', '$http', '$location', 'Users', 'Authentication',
  function ($scope, $http, $location, Users, Authentication) {
    $scope.user = Authentication.user;

    // Update a user profile
    $scope.updateUserProfile = function (isValid) {
      if (isValid) {
        $scope.success = $scope.error = null;
        var user = new Users($scope.user);

        user.$update(function (response) {
          $scope.success = true;
          Authentication.user = response;
        }, function (response) {
          $scope.error = response.data.message;
        });
      } else {
        $scope.submitted = true;
      }
    };

    // Send another email confirmation
    $scope.emailConfirmation = function() {
        $http.post('/api/users/email/confirmation').success(function (response) {
            $scope.message = 'Email sent successfully';
            $scope.success = true;
        }).error(function (response) {
            $scope.message = 'Email failed to send';
        });
    };
  }
]);
