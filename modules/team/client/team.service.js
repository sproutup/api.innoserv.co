'use strict';

angular
    .module('team')
    .factory('TeamService', TeamService);

TeamService.$inject = ['$resource'];

function TeamService($resource) {
  var service = {
    team: team,
    listByUser: listByUser,
    listByCompany: listByCompany
  };

  return service;

  function team () {
     return $resource('/api/team/:teamId', {teamId:'@Id'}, { 'update': {method:'PUT'}, 'query': {method:'GET', isArray:true} } );
  }

  function listByUser () {
     return $resource('/api/user/:userId/company', {userId:'@userId'}, { 'update': {method:'PUT'}, 'query': {method:'GET', isArray:true} } );
  }

  function listByCompany () {
     return $resource('/api/company/:companyId/user', {companyId:'@companyId'}, { 'update': {method:'PUT'}, 'query': {method:'GET', isArray:true} } );
  }
}

