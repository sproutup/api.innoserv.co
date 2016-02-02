'use strict';
/* global moment:false */

angular
    .module('core')
    .constant('moment', moment)
    .directive('upTrialCard', upTrialCard);

function upTrialCard() {
    var directive = {
        restrict: 'EA',
        templateUrl: 'modules/core/client/directives/up-trial-card.html',
        scope: {
            trial: '='
        },
        controller: upTrialCardController,
        controllerAs: 'vm'
    };

    return directive;

}

upTrialCardController.$inject = ['$state', 'amMoment', '$scope', 'moment'];

function upTrialCardController($state, amMoment, $scope, moment) {
    var vm = $scope;

    function isRecievedEvent(item) {
        return item.status === 3;
    }

    // // If this is an active trial, calculate how many days are left and such
    if (vm.trial.status === 3) {
        var recievedEvent = vm.trial.log.filter(isRecievedEvent);
        if (recievedEvent[0]) {
            vm.trial.recievedEvent = true;
            var start = moment(recievedEvent[0].createdAt).startOf('day');
            var end = moment(vm.trial.trialEndsAt).startOf('day');
            var duration = end.diff(start, 'days') - 1;
            vm.trial.daysLeft = end.diff(moment(), 'days');
            vm.trial.percentageLeft = (vm.trial.daysLeft / duration) * 100;
            // Make sure percentageLeft is 0 if days left is 0
            if (vm.trial.daysLeft === 0) {
                vm.trial.percentageLeft = 0;
            }
            // Check if this trial is overdue 
            if (vm.trial.daysLeft < 0) {
                vm.trial.overdue = true;
                vm.trial.percentageLeft = 100;
                vm.trial.daysLeft = Math.abs(vm.trial.daysLeft);
            }
        }
    }
}