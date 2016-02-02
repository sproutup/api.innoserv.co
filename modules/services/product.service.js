angular
    .module('products')
    .factory('ProductService', ProductService);

ProductService.$inject = ['$resource'];

function ProductService($resource) {
	var service = {
		getProduct: getProduct
	};

	function getProduct() {
		console.log('getting product');
	}

	return service;

}