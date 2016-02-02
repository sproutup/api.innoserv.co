'use strict';

angular
    .module('core')
    .directive('upTimeline', upTimeline);

function upTimeline() {
    var directive = {
        restrict: 'EA',
        templateUrl: 'modules/timeline/client/up-timeline.html',
        scope: {
            events: '=',
        },
        link: linkFunc,
        controller: UpTimelineController,
        controllerAs: 'vm',
        bindToController: true
    };

    return directive;

    function linkFunc(scope, element, attr, ctrl) {
        
    }    
}

UpTimelineController.$inject = ['$scope'];

function UpTimelineController($scope) {

}