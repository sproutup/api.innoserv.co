'use strict';

(function() {

	angular
	    .module('social')
	    .controller('socialController', socialController);

	socialController.$inject = ['$scope'];

	function socialController($scope) {
		var vm = this;
		vm.item = {};
		vm.item.title = 'Social';
		vm.item.stats = [{
			stat: 'Impressions',
			number: '454,948',
			sref: 'user.social.impressions'
		}, {
			stat: 'Posts',
			number: '21',
			sref: 'user.social.posts'
		}];

		vm.impressions = {};
		vm.impressions.labels = ['February', 'March', 'April', 'May', 'June', 'July'];
		vm.impressions.series = ['Potential Reach Total', 'Impressions'];
		vm.impressions.data = [
			[45007, 105040, 69102, 70483, 39391, 93938],
			[10938, 28905, 23394, 19874, 8394, 28048]
		];
	}

})();