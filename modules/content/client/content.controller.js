'use strict';

(function() {

	angular
	    .module('content')
	    .controller('contentController', contentController);

	contentController.$inject = ['$scope', 'ContentService'];

	function contentController($scope, ContentService) {
		var vm = this;
		vm.item = {};
		vm.content = [];
		vm.item.title = 'Content';
		vm.item.stats = [{
			stat: 'Videos',
			number: '12',
			sref: 'user.content.videos'
		}, {
			stat: 'Blogs',
			number: '8',
			sref: 'user.content.blogs'
		}];

		vm.content = ContentService.getContent();

		vm.chartOptions = {
	  		scaleShowLabels: false,
	  		scaleFontSize: 0
	  	};


		loadCallback(ContentService);

	    function loadCallback(content) {
	        for (var c = 0; c < content.length; c++) {
	            if (content[c].content) {
	                optimizeContentDisplay(content[c]);
	            }
	            vm.content.push(content[c]);
	        }
	    }

		function optimizeContentDisplay(contentObject) {
	        displayYoutubeVideo(contentObject.content);
	        displayTweet(contentObject.content);
	    }

	    function contains(str, substr) {
	        return (str.indexOf(substr) > -1);
	    }

	    var youtubeRegexp = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;
	    var timeRegexp = /t=(\d+)[ms]?(\d+)?s?/;

	    // Put into service. Refactor the Regex. It should handle all of the logic that grabs the id.
	    function displayYoutubeVideo(content) {
	        if (typeof content.url === 'undefined') return;
	        var match = content.url.match(/https:\/\/www.youtube.com\/watch/g);
	        if (match) {
	            var id = content.url.replace(youtubeRegexp, '$1');
	            if (contains(id, ';')) {
	                var pieces = id.split(';');
	                if (contains(pieces[1], '%')) {
	                    // links like this:
	                    // "http://www.youtube.com/attribution_link?a=pxa6goHqzaA&amp;u=%2Fwatch%3Fv%3DdPdgx30w9sU%26feature%3Dshare"
	                    // have the real query string URI encoded behind a ';'.
	                    // at this point, `id is 'pxa6goHqzaA;u=%2Fwatch%3Fv%3DdPdgx30w9sU%26feature%3Dshare'
	                    var uriComponent = decodeURIComponent(id.split(';')[1]);
	                    id = ('http://youtube.com' + uriComponent)
	                            .replace(youtubeRegexp, '$1');
	                } else {
	                    // https://www.youtube.com/watch?v=VbNF9X1waSc&amp;feature=youtu.be
	                    // `id` looks like 'VbNF9X1waSc;feature=youtu.be' currently.
	                    // strip the ';feature=youtu.be'
	                    id = pieces[0];
	                }
	            } else if (contains(id, '#')) {
	                // id might look like '93LvTKF_jW0#t=1'
	                // and we want '93LvTKF_jW0'
	                id = id.split('#')[0];
	            }
	            if (id) {
	                content.youtube = 'https://www.youtube.com/embed/' + id;
	            }
	        }
	        // Check for 'youtu.be' links
	        var secondMatch;
	        if (!match) {
	            secondMatch = content.url.match(/youtu.be\//g);
	            if (secondMatch) {
	                var index = content.url.indexOf(secondMatch);
	                var videoID = content.url.substring((index + 9), content.url.length);
	                content.youtube = 'https://www.youtube.com/embed/' + videoID;
	            }
	            
	        }
	    }

	    // Put into service. 
	    function displayTweet(content) {
	        if (typeof content.url === 'undefined') return;

	        var match = content.url.match(/twitter.com\/\w+\/status\/\w+/g);
	        if (match && content.title) {
	            var statusIndex = match[0].indexOf('/status/');
	            var twitterUsername = match[0].substring(12, statusIndex);
	            var onTwitterIndex = content.title.indexOf('on Twitter');
	            var twitterName = content.title.substring(0, onTwitterIndex);
	            var tweetBody = content.description.substring(1, (content.description.length - 1));
	            var mediaIndex = content.image.indexOf('/media/');
	            content.tweet = {
	                twitterUsername: twitterUsername,
	                twitterName: twitterName,
	                tweetBody: tweetBody
	            };
	            if (mediaIndex > 0) {
	                content.tweet.picture = content.image;
	            }
	        }
	    }
	}
})();