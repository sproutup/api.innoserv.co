'use strict';

angular.module('users').run(['Menus',
  function (Menus) {
    Menus.addMenuItem('company.user.settings.menu', {
      title: 'Profile',
      state: 'company.navbar.user.profile',
      class: '',
      roles: ['*'],
      position: 10
    });

    Menus.addMenuItem('company.user.settings.menu', {
      title: 'Password',
      state: 'company.navbar.user.password',
      class: '',
      roles: ['*'],
      position: 20
    });
  }
]);

// Config HTTP Error Handling
angular.module('users').config(['$httpProvider',
  function ($httpProvider) {
    // Set the httpProvider "not authorized" interceptor
    $httpProvider.interceptors.push(['$q', '$location', 'Authentication',
      function ($q, $location, Authentication) {
        return {
          responseError: function (rejection) {
            switch (rejection.status) {
              case 401:
                // Deauthenticate the global user
                Authentication.user = null;

                // Redirect to signin page
                $location.path('signin');
                break;
              case 403:
                // Add unauthorized behaviour
                break;
            }

            return $q.reject(rejection);
          }
        };
      }
    ]);
  }
]);
