'use strict';

// Authentication service for user variables
angular.module('users').factory('Authentication', ['$window',
  function ($window) {
    var auth = {
      user: $window.user,
      company: {},
      setCompany: setCompany
    };

    return auth;

    function setCompany(company){
      console.log('set company: ', company.name);
      auth.company = company;
    }
 }


]);
