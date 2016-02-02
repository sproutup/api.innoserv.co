'use strict';

angular
    .module('content')
    .factory('ContentService', ContentService);

ContentService.$inject = ['$resource'];

function ContentService($resource){
  var service = {
    getContent: getContent 
  };

  return service;

  function getContent () {
    return [
      {
        user: {
          profileImageURL: 'https://yt3.ggpht.com/-_gNR0XqmaFg/AAAAAAAAAAI/AAAAAAAAAAA/e_l7cL9lvmI/s88-c-k-no/photo.jpg',
          name: 'Berkman Center'
        },
        type: 'youtube',
        url: 'https://www.youtube.com/embed/A_0FgRKsqqU',
        views: '108,837',
        minutesWatched: '837,928',
        likes: '1,203',
        comments: '2,873',
        clicks: {
          labels: ['January', 'February', 'March', 'April', 'May'],
          data: [ [180, 1100, 240, 727, 1232] ],
          series: 'Clicks'
        }
      }, 
      {
        user: {
          profileImageURL: 'https://d30xksqof6w2my.cloudfront.net/330614cd-bc7a-491f-a3be-7c809239c0e4_17.jpg?w=256&h=256',
          name: 'Sproutup'
        },
        type: 'blog',
        image: 'http://d30xksqof6w2my.cloudfront.net/44e9ccf3-a007-4ebe-ad42-4c76f884a915_0_admin.jpg?w=1600',
        title: 'Tile on SproutUp',
        description: 'Lose less of everything, including your valuable time.',
        url: 'http://www.sproutup.co/product/tile',
        uniqueVisitors: '108,837',
        refferalClicks: '3203',
        clicks: {
          labels: ['January', 'February', 'March', 'April', 'May'],
          data: [ [180, 1100, 240, 727, 1232] ],
          series: 'Clicks'
        }
      }
    ]; 
  }    
}