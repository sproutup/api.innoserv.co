'use strict';

angular
    .module('product')
    .factory('ProductService', ProductService);

ProductService.$inject = ['$resource'];

function ProductService($resource) {
  var service = {
    listByCompany: listByCompany,
    products: products
  };

  return service;

  function products () {
     return $resource('/api/product/:productId', {productId:'@productId'}, { 'update': {method:'PUT'}, 'query': {method:'GET', isArray:true} } );
  }

  function listByCompany () {
     return $resource('/api/company/:companyId/product', {companyId:'@companyId'}, { 'update': {method:'PUT'}, 'query': {method:'GET', isArray:true} } );
  }
}