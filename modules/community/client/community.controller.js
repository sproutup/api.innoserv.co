'use strict';

(function() {

	angular
	    .module('community')
	    .controller('communityController', communityController);

	communityController.$inject = ['$scope'];

	function communityController($scope) {
		var vm = this;
		vm.item = {};
		vm.item.title = 'Community';
		vm.item.stats = [{
			stat: 'Requests',
			number: '154',
			sref: 'user.community.requests'
		}, {
			stat: 'Trials',
			number: '21',
			sref: 'user.community.trials'
		}, {
			stat: 'Ambassadors',
			number: '32',
			sref: 'user.community.ambassadors'
		}];
		vm.item.labels = ['Download Sales', 'In-Store Sales', 'Mail-Order Sales'];
  		vm.item.data = [300, 500, 100];

  		vm.requests = {
  			total: 170000,
  			labels: ['Twitter', 'YouTube', 'Instagram', 'Other'],
  			data: [33817, 71028, 28277, 59862]
  		};

  		vm.ambassadors = [{
  			name: 'Thomas Hatfield',
  			urlTwitter: 'https://twitter.com/sproutupco',
  			urlYoutube: 'https://www.youtube.com/channel/UCctXZhXmG-kf3tlIXgVZUlw',
  			twitterCount: 28282,
  			youtubeCount: 24389,
  			avatarUrl: 'http://d30xksqof6w2my.cloudfront.net/eab0dc0d-6822-4900-aabd-105687cddfa5_480.jpg?w=256&h=256'
  		}, {
  			name: 'Thomas Hatfield',
  			urlTwitter: 'https://twitter.com/sproutupco',
  			urlYoutube: 'https://www.youtube.com/channel/UCctXZhXmG-kf3tlIXgVZUlw',
   			twitterCount: 92920,
  			youtubeCount: 250389,
  			avatarUrl: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQsltvNfQKqvYfr8UMG28Xwp0PdgLUNwC6jXVTwoQ7PTWsc_2ik-i_oqxpN_A'
  		}, {
  			name: 'Christopher Sese-Khalid',
  			urlTwitter: 'https://twitter.com/sproutupco',
  			urlYoutube: 'https://www.youtube.com/channel/UCctXZhXmG-kf3tlIXgVZUlw',
  			twitterCount: 325920,
  			youtubeCount: 920389,
  			avatarUrl: 'https://yt3.ggpht.com/-gYIpT9q6l2U/AAAAAAAAAAI/AAAAAAAAAAA/N7y-mZkllOc/s100-c-k-no/photo.jpg'
  		}, {
  			name: 'Patrick Campanale',
  			urlTwitter: 'https://twitter.com/sproutupco',
  			urlYoutube: 'https://www.youtube.com/channel/UCctXZhXmG-kf3tlIXgVZUlw',
  			twitterCount: 32920,
  			youtubeCount: 20389,
  			avatarUrl: 'data:image/jpeg;base64,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'
  		}];

  		vm.trials = [{
		    'id': 717,
		    'name': 'Christopher Sese-Khalid (iAndroid Chris)',
		    'reason': 'With me not only being a tech nerd, I also love weather. Sometimes I look up at the sky hoping that it will rain because I love the mood that it gives off sometimes. Which is why I would like to make a High Quality YouTube video about your it to spread the word about your amazing product. Thank You.',
		    'active': true,
		    'status': 1,
		    'createdAt': '2015-08-24T09:02:02.000Z',
		    'updatedAt': '2015-08-24T09:02:02.000Z',
		    'user': {
		      'id': 732,
		      'description': 'I make tech videos of products I would like to advertise, and give my review on them. My YouTube channel is www.youtube.com/iandroidchris',
		      'name': 'Christopher Sese-Khalid Jr (iAndroid Chris)',
		      'nickname': 'christophersesekhalid',
		      'avatarUrl': 'http://d30xksqof6w2my.cloudfront.net/b1f25824-b527-47b5-a03b-5778e25a84ef_732.jpg?w=256&h=256',
		      'urlTwitter': 'http://twitter.com/iandroidchris',
		      'urlYoutube': 'http://www.youtube.com/iandroidchris',
		      'points': '0',
		      'posts': 1,
		      'trials': 2
		      },
		    'content': [],
		    'log': [
		      {
		        'id': 826,
		        'status': 3,
		        'createdAt': '2015-10-16T17:43:36.000Z'
		      }
		    ],
		    'refURL': 'http://goo.gl/H3Bmpj'
		  }, {
		    'id': 1554,
		    'name': 'Patrick Campanale',
		    'active': true,
		    'status': 3,
		    'createdAt': '2015-10-20T18:48:12.000Z',
		    'updatedAt': '2015-11-05T17:45:09.000Z',
		    'trialEndsAt': '2015-11-11T17:45:09.000Z',
		    'user': {
		      'id': 480,
		      'name': 'Patrick Campanale',
		      'nickname': 'patrickcampanale',
		      'avatarUrl': 'http://d30xksqof6w2my.cloudfront.net/eab0dc0d-6822-4900-aabd-105687cddfa5_480.jpg?w=256&h=256',
		      'urlTwitter': 'http://twitter.com/pcamp96',
		      'urlFacebook': 'http://www.facebook.com/patrick.campanale',
		      'urlBlog': 'http://www.gadgtspot.com',
		      'urlPinterest': null,
		      'urlYoutube': 'http://www.youtube.com/GadgtSpot',
		      'isInfluencer': true,
		      'points': '2020',
		      'posts': 4,
		      'trials': 5
		    },
		    'content': [],
		    'log': [
		      {
		        'id': 826,
		        'status': 3,
		        'createdAt': '2015-10-26T17:43:36.000Z'
		      }
		    ],
		    'refURL': 'http://goo.gl/A3cCNj'
		  }, {
		    'id': 1007,
		    'name': 'Scotty Powell',
		    'reason': 'Meteorologist in Western North Carolina, and would love to add footage and real time data to our audience',
		    'active': true,
		    'status': 3,
		    'createdAt': '2015-09-24T17:38:56.000Z',
		    'updatedAt': '2015-10-16T17:43:36.000Z',
		    'trialEndsAt': '2015-11-01T17:43:36.000Z',
		    'user': {
		      'id': 1095,
		      'description': 'Meteorologist for Foothills Weater Network, Hickory Crawdads & WSVM. Host of Carolina Weather Group.',
		      'name': 'Scotty Powell',
		      'nickname': 'scottypowell',
		      'avatarUrl': 'http://d30xksqof6w2my.cloudfront.net/8fa209d8-2538-4685-a59b-d02179a76d1f_1095.jpg?w=256&h=256',
		      'urlTwitter': 'https://twitter.com/Captcomeback',
		      'urlFacebook': 'https://www.facebook.com/scotty.powell.10',
		      'urlBlog': 'http://www.foothillsweathernetwork.com/',
		      'urlPinterest': null,
		      'urlYoutube': 'https://www.youtube.com/channel/UCmhGiYbMDccQcdSjpf87nGg',
		      'isInfluencer': true,
		      'points': '0',
		      'posts': 0,
		      'trials': 1
		    },
		    'content': [{
	  			name: 'A picture with bae',
	  			impressions: '23402',
	  			clicks: '234',
	  			purchases: '7',
	  			type: 'Instagram'
	  		}, {
	  			name: '"I\'m doing an AMA right now about my Boosted board"',
	  			impressions: '13736',
	  			clicks: '152',
	  			purchases: '2',
	  			type: 'Twitter'
	  		}, {
	  			name: '"Check out Sproutup\'s new products, including X."',
	  			impressions: '10912',
	  			clicks: '134',
	  			purchases: '4',
	  			type: 'Twitter'
	  		}],
	  		'contentType': 'Content created during product trial',
		    'log': [
		      {
		        'id': 826,
		        'status': 3,
		        'createdAt': '2015-10-16T17:43:36.000Z'
		      }
		    ],
		    'refURL': 'http://goo.gl/P8vb9C'
		  }];
    }

})();