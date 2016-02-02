'use strict';

(function() {

	angular
	    .module('overview')
	    .controller('overviewController', overviewController);

	overviewController.$inject = ['$scope', 'Authentication'];

	function overviewController($scope, Authentication) {
		var vm = this;
		vm.item = {};
		vm.item.title = 'Home';
		vm.item.stats = [{
			stat: 'Social media impressions',
			number: '460,321',
			sref: 'user.overview.impressions'
		}, {
			stat: 'Content views',
			number: '201,321',
			sref: 'user.overview.content'
		}, {
			stat: 'Engagements',
			number: '1,921',
			sref: 'user.overview.engagement'
		}];
		
		vm.user = Authentication.user;

    vm.community = {};
    vm.content = {};
    vm.engagement = {};
    vm.social = {};
    vm.impressions = {};

  	vm.impressions.labels = ['January', 'February', 'March', 'April', 'May'];
  	vm.impressions.series = ['Impressions'];
  	vm.impressions.data = [ [41228, 91910, 72940, 120227, 108321] ];

    vm.content.labels = ['January', 'February', 'March', 'April', 'May'];
    vm.content.series = ['Impressions'];
    vm.content.data = [ [51228, 21910, 62940, 30227, 50321] ];

    vm.engagement.labels = ['January', 'February', 'March', 'April', 'May'];
    vm.engagement.series = ['Impressions'];
    vm.engagement.data = [ [228, 390, 580, 297, 721] ];

		vm.impressions.topStats = [{
			name: 'A picture with bae',
			impressions: '23402',
			clicks: '234',
			purchases: '7',
			type: 'Instagram'
		}, {
			name: '"I\'m doing an AMA right now about my Boosted board" — @kevintechninja',
			impressions: '10912',
			clicks: '134',
			purchases: '3',
			type: 'Twitter'
		}, {
			name: '"Check out Sproutup\'s new products, including X." — @kevintechninja',
			impressions: '10912',
			clicks: '134',
			purchases: '3',
			type: 'Twitter'
		}];

		vm.community.name = 'Community';
		vm.community.stats = [{
			number: '194,837',
			name: 'Reach'
		}, {
			number: '37',
			name: 'Trials'
		}, {
			number: '12',
			name: 'Ambassadors'
		}];

		vm.content.name = 'Content';
		vm.content.stats = [{
			number: '19',
			name: 'Pieces'
		}, {
			number: '180,402',
			name: 'Video Views'
		}, {
			number: '79,928',
			name: 'Blog Views'
		}];

		vm.engagement.name = 'Engagement';
		vm.engagement.stats = [{
			number: '19,837',
			name: 'Total'
		}, {
			number: '37',
			name: 'Purchases'
		}];

		vm.engagement.topStats = [{
			name: '10 minutes with Boosted Boards',
			impressions: '234',
			clicks: '234',
			purchases: '23',
			type: 'YouTube'
		}, {
			name: 'What are those?',
			impressions: '234',
			clicks: '234',
			purchases: '23',
			type: 'YouTube'
		}, {
			name: '8 things about 8 things',
			impressions: '4912',
			clicks: '234',
			purchases: '23',
			type: 'Blog'
		}];
		
		vm.social.name = 'Social';
		vm.social.stats = [{
			number: '294,837',
			name: 'Impressions'
		}, {
			number: '21',
			name: 'Posts'
		}];

		vm.summaries = [vm.community, vm.content, vm.engagement, vm.social];
	}

})();