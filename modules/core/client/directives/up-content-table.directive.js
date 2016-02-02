'use strict';

angular
    .module('core')
    .directive('upContentTable', upContentTable);

function upContentTable() {
    var directive = {
        restrict: 'EA',
        templateUrl: 'modules/core/client/directives/up-content-table.html',
        scope: {
            content: '=',
            contenttype: '@'
        },
        link: linkFunc,
        controller: UpContentTableController,
        controllerAs: 'vm',
        bindToController: true
    };

    return directive;

    function linkFunc(scope, element, attr, ctrl) {

    }    
}

UpContentTableController.$inject = ['$scope'];

function UpContentTableController($scope) {

}