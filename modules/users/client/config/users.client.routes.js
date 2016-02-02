'use strict';

// Setting up route
angular.module('users').config(['$stateProvider',
  function ($stateProvider) {
    // Users state routing
    $stateProvider
      .state('company.navbar.user', {
        abstract: true,
        url: '/user',
        templateUrl: 'modules/users/client/views/settings/settings.client.view.html',
        controller: 'SettingsController',
        controllerAs: 'vm',
        data: {
          roles: ['user', 'admin']
        }
      })
      .state('company.navbar.user.profile', {
        url: '/profile',
        templateUrl: 'modules/users/client/views/settings/edit-profile.client.view.html'
      })
      .state('company.navbar.user.password', {
        url: '/password',
        templateUrl: 'modules/users/client/views/settings/change-password.client.view.html'
      })
      .state('company.navbar.user.accounts', {
        url: '/accounts',
        templateUrl: 'modules/users/client/views/settings/manage-social-accounts.client.view.html'
      })
      .state('company.navbar.user.picture', {
        url: '/picture',
        templateUrl: 'modules/users/client/views/settings/change-profile-picture.client.view.html'
      })
      .state('authentication', {
        abstract: true,
        url: '/authentication',
        templateUrl: 'modules/users/client/views/authentication/authentication.client.view.html'
      })
      .state('authentication.signup', {
        url: '/signup/:token',
        templateUrl: 'modules/users/client/views/authentication/signup.client.view.html'
      })
      .state('authentication.signin', {
        url: '/signin?err',
        templateUrl: 'modules/users/client/views/authentication/signin.client.view.html'
      })
      .state('password', {
        abstract: true,
        url: '/password',
        template: '<ui-view/>'
      })
      .state('password.forgot', {
        url: '/forgot',
        controller: 'PasswordController',
        templateUrl: 'modules/users/client/views/password/forgot-password.client.view.html'
      })
      .state('password.sent', {
        url: '/sent',
        templateUrl: 'modules/users/client/views/password/forgot-password-confirmation.client.view.html'
      })
      .state('password.reset', {
        abstract: true,
        url: '/reset',
        template: '<ui-view/>'
      })
      .state('password.reset.invalid', {
        url: '/invalid',
        templateUrl: 'modules/users/client/views/password/reset-password-invalid.client.view.html'
      })
      .state('password.reset.success', {
        url: '/success',
        templateUrl: 'modules/users/client/views/password/reset-password-success.client.view.html'
      })
      .state('password.reset.sent', {
        url: '/sent',
        controller: 'PasswordController',
        params: {
          'emailSent': 'your email'
        },
        templateUrl: 'modules/users/client/views/password/forgot-password-confirmation.client.view.html'
      })
      .state('password.reset.form', {
        url: '/:token',
        controller: 'PasswordController',
        templateUrl: 'modules/users/client/views/password/reset-password.client.view.html'
      })
      .state('email', {
        abstract: true,
        url: '/email',
        template: '<ui-view/>'
      })
      .state('email.confirmation', {
        abstract: true,
        url: '',
        template: '<ui-view/>'
      })
      .state('email.confirmation.details', {
        url: '/confirmation/:token',
        templateUrl: 'modules/users/client/views/authentication/email-confirmation-details.html',
        controller: 'AuthenticationController'
      })
      .state('email.confirmation.success', {
        url: '/success',
        templateUrl: 'modules/users/client/views/authentication/email-confirmation-success.client.view.html'
      })
      .state('email.confirmation.invalid', {
        url: '/invalid',
        controller: 'EmailController',
        templateUrl: 'modules/users/client/views/authentication/email-confirmation-invalid.client.view.html'
      });
  }
]);
