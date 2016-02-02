'use strict';

angular
    .module('core')
    .directive('upDashboardHeader', upDashboardHeader);

function upDashboardHeader() {
    var directive = {
        restrict: 'EA',
        templateUrl: 'modules/core/client/directives/up-dashboard-header.html',
        scope: {
            item: '=',
        },
        link: linkFunc,
        controller: UpDashboardHeaderController,
        controllerAs: 'vm',
        bindToController: true
    };

    return directive;

    function linkFunc(scope, element, attr, ctrl) {
        
    }    
}

UpDashboardHeaderController.$inject = ['$scope'];

function UpDashboardHeaderController($scope) {

}