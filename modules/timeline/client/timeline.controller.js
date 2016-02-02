'use strict';

(function() {

	angular
	    .module('timeline')
	    .controller('timelineController', timelineController);

	timelineController.$inject = ['$scope'];

	function timelineController($scope) {
		var vm = this;
		vm.item = {};
		vm.item.title = 'Timeline';

    vm.events = [{
      time: '8:31 pm',
      type: 'purchase',
      user: {
        name: 'Ade LoveLace',
        avatarUrl: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSm0-SJiNP7t5K0uMv6p_xlh7vxm9Gh9qi-V41tOt8FjeWabRMUpw'
      },
      text: 'Ade LoveLace bought a Boosted Board 🎉'
    }, {
      time: '4:53 pm',
      type: 'content',
      user: {
        name: 'Ade LoveLace',
        avatarUrl: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSm0-SJiNP7t5K0uMv6p_xlh7vxm9Gh9qi-V41tOt8FjeWabRMUpw'
      },
      text: 'Ade LoveLace began her trial with Boosted Boards'
    }, {
      time: '4:33 pm',
      type: 'content',
      user: {
        name: 'Andreas Kaggle',
        avatarUrl: 'https://pbs.twimg.com/profile_images/649108987128868864/rWnwMe55.jpg'
      },
      text: 'Andreas Kaggle published a video on YouTube'
    }, {
      time: '2:30 pm',
      type: 'content',
      user: {
        name: 'Andreas Kaggle',
        avatarUrl: 'https://pbs.twimg.com/profile_images/649108987128868864/rWnwMe55.jpg'
      },
      text: 'Andreas Kaggle published a video on Vine'
    }, {
      time: '1:45 pm',
      type: 'trial',
      user: {
        name: 'Andreas Kaggle',
        avatarUrl: 'https://pbs.twimg.com/profile_images/649108987128868864/rWnwMe55.jpg'
      },
      text: 'Andreas Kaggle began his trial with Boosted Boards'
    }, {
      time: 'Wednesday',
      type: 'content',
      user: {
        name: 'Neo Briggs',
        avatarUrl: 'http://myhero.com/images/guest/g243/hero106692/bill%20gates.jpeg'
      },
      text: 'Neo Briggs published a video on YouTube'
    }, {
      time: 'Monday',
      type: 'purchase',
      user: {
        name: 'Peter Money',
        avatarUrl: 'http://blogs-images.forbes.com/gregsatell/files/2014/10/Peter-Thiel-e1412381632497.jpg'
      },
      text: 'Peter Money bought a Boosted Board 🎉'
    }, {
      time: 'Monday',
      type: 'content',
      user: {
        name: 'Peter Money',
        avatarUrl: 'http://blogs-images.forbes.com/gregsatell/files/2014/10/Peter-Thiel-e1412381632497.jpg'
      },
      text: 'Peter Money posted a video on YouTube'
    }, {
      time: 'Monday',
      type: 'content',
      user: {
        name: 'Neo Briggs',
        avatarUrl: 'http://myhero.com/images/guest/g243/hero106692/bill%20gates.jpeg'
      },
      text: 'Neo Briggs posted on Instagram'
    }, {
      time: 'Saturday',
      type: 'trial',
      user: {
        name: 'Neo Briggs',
        avatarUrl: 'http://myhero.com/images/guest/g243/hero106692/bill%20gates.jpeg'
      },
      text: 'Neo Briggs began his trial with Boosted Boards'
    }, {
      time: 'Monday',
      type: 'trial',
      user: {
        name: 'Peter Money',
        avatarUrl: 'http://blogs-images.forbes.com/gregsatell/files/2014/10/Peter-Thiel-e1412381632497.jpg'
      },
      text: 'Peter Money began his trial with Boosted Boards'
    }];
	}

})();