'use strict';

angular
  .module('company')
  .factory('CompanyService', CompanyService);

CompanyService.$inject = ['$resource'];

function CompanyService($resource) {
  var service = {
    company: company,
    companyBySlug: companyBySlug,
    companyByUser: companyByUser
  };

  return service;

  function company () {
    //return $resource('/api/company/:companyId', {companyId: '@id'}, { 'update': {method:'PUT'}, 'query': {method:'GET', isArray:true} } );
    return $resource('/api/company/:companyId', { companyId: '@id' }, { 'update': { method:'PUT' } } );
  }

  function companyBySlug () {
    return $resource('/api/company/slug/:companySlug', { companySlug:'@slug' }, { 'update': { method:'PUT' }, 'query': { method:'GET', isArray:true } } );
  }

  function companyByUser () {
    return $resource('/api/user/:userId/company', { userId:'@userId' }, { 'update': { method:'PUT' }, 'query': { method:'GET', isArray:true } } );
  }

}
