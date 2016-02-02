'use strict';

(function() {

	angular
	    .module('engagement')
	    .controller('engagementController', engagementController);

	engagementController.$inject = ['$scope'];

	function engagementController($scope) {
		var vm = this;
		vm.item = {};
		vm.content = [];
		vm.pageViews = {};
		vm.pageViews.demographics = 1;
		vm.clicks = {};
		vm.clicks.demographics = 1;
		vm.purchases = {};
		vm.purchases.demographics = 1;
		vm.item.title = 'Engagement';
		vm.item.stats = [{
			stat: 'Page views',
			number: '35,938',
			sref: 'user.engagement.page-views'
		}, {
			stat: 'Clicks',
			number: '3520',
			sref: 'user.engagement.clicks'
		}, {
			stat: 'Purchases',
			number: '20',
			sref: 'user.engagement.purchases'
		}];

		
		vm.pageViews.labels = ['January', 'February', 'March', 'April', 'May'];
	  	vm.pageViews.series = ['Page Views'];
	  	vm.pageViews.data = [ [128, 11910, 940, 10227, 18321] ];

		vm.clicks.labels = ['January', 'February', 'March', 'April', 'May'];
	  	vm.clicks.series = ['Clicks'];
	  	vm.clicks.data = [ [180, 1100, 240, 727, 1232] ];

	  	vm.purchases.labels = ['January', 'February', 'March', 'April', 'May'];
	  	vm.purchases.series = ['Purchases'];
	  	vm.purchases.data = [ [2, 4, 1, 3, 10] ];

	  	vm.options = {
	  		scaleShowLabels: false,
	  		scaleFontSize: 0
	  	};
	}

})();