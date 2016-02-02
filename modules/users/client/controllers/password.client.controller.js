'use strict';

angular.module('users').controller('PasswordController', ['$scope', '$http', '$location', 'Authentication', '$state', '$stateParams',
  function ($scope, $http, $location, Authentication, $state, $stateParams) {
    $scope.authentication = Authentication; 

    //If user is signed in then redirect back home
    if ($scope.authentication.user) {
      $location.path('/');
    }

    // This variable tells us who the email was sent to. It is set in password.server.controller
    $scope.emailSent = $stateParams.emailSent;

    // Submit forgotten password account id
    $scope.askForPasswordReset = function () {
      $scope.success = $scope.error = null;

      $http.post('/api/auth/forgot', $scope.credentials).success(function (response) {
        // Show user success message and clear form
        $scope.credentials = null;
        $scope.success = response.message;
        $state.go('password.reset.sent', { 'emailSent': response.emailSent });
      }).error(function (response) {
        // Show user error message and clear form
        $scope.credentials = null;
        $scope.error = response.message;
      });
    };

    // Change user password
    $scope.resetUserPassword = function () {
      $scope.success = $scope.error = null;

      $http.post('/api/auth/reset/' + $stateParams.token, $scope.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.passwordDetails = null;

        // Attach user profile
        Authentication.user = response;

        // And redirect to the index page
        $state.go('mycompany');
      }).error(function (response) {
        $scope.error = response.message;
      });
    };
  }
]);
