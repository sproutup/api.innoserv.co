'use strict';

angular
  .module('campaign')
  .factory('TemplateService', TemplateService);

TemplateService.$inject = ['$resource'];

function TemplateService($resource) {
  var service = {
    listByCompany: listByCompany,
    template: template
  };

  return service;

  function template () {
     return $resource('/api/campaign/template/:campaignId', {campaignId:'@id'}, { 'update': {method:'PUT'}, 'query': {method:'GET', isArray:true} } );
  }

  function listByCompany () {
     return $resource('/api/company/:companyId/campaign', {companyId:'@companyId'}, { 'update': {method:'PUT'}, 'query': {method:'GET', isArray:true} } );
  }

}
