'use strict';

angular
  .module('community')
  .factory('TrialService', TrialService);

TrialService.$inject = ['$resource'];

function TrialService($resource) {
  var service = {
    getTrials: getTrials
  };

  return service;

  function getTrials() {
    return [{
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
}