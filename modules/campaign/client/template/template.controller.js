'use strict';

(function() {

  angular
    .module('campaign')
    .controller('TemplateController', TemplateController);

    TemplateController.$inject = ['$scope', '$rootScope', 'TrialService', '$state', 'CampaignService', 'TemplateService', '$location', 'Authentication', 'TeamService', 'ProductService', '$cookieStore', '$modal'];

    function TemplateController($scope, $rootScope, TrialService, $state, CampaignService, TemplateService, $location, Authentication, TeamService, ProductService, $cookieStore, $modal) {
      var vm = this;
      vm.init = init;
      vm.create = create;
      vm.remove = remove;
      vm.update = update;
      vm.cancel = cancel;
      vm.find = find;
      vm.load = load;
      vm.findOne = findOne;
      vm.item = {};
      vm.openModal = openModal;
      vm.types = [
        { id: 'trial', 
          name: 'Product Trial'},
        { id: 'contents',
          name: 'Video Contest'}
      ];
      vm.socialOptions = [
        {  title: 'Twitter',
           type: 'tw' },
        {  title: 'Instagram',
           type: 'ig' },
        {  title: 'YouTube',
           type: 'yt' }
      ];

      function init(type) {
        vm.item = {};
        vm.item.type = type;
      }

      function create(isValid) {
        vm.error = null;

        if (!isValid) {
          $scope.$broadcast('show-errors-check-validity', 'campaignForm');

          return false;
        }

        // Hack for creating typeOfContent array
        var typeOfContent = [];
        for (var s = 0; s < vm.socialOptions.length; s++) {
          if (vm.socialOptions[s].type) {
            typeOfContent.push(vm.socialOptions[s].type);
          }
        }

        // Create new template
        var Template = TemplateService.template();
        var item = new Template(vm.item);
        item.companyId = $scope.company.company.id;
        item.productId = vm.productId;
        item.typeOfContent = typeOfContent;

        // Redirect after save
        item.$save(function (response) {
          console.log('created this: ', response);
          $state.go('company.navbar.template.list');
          // Clear form fields
        vm.description = '';
        }, function (errorResponse) {
          vm.error = errorResponse.data.message;
        });
      }

      function remove(item) {
        if (item) {
          item.$remove({
            campaignId: item.id
          }, function() {
            $state.go('company.navbar.template.list');
          });

          // for (var i in vm.companies) {
          //   if (vm.companies[i] === campaign) {
          //     vm.companies.splice(i, 1);
          //   }
          // }
        } 
        // else {
          // test this 
          // vm.campaign.$remove(function () {
          //   $location.path('user.campaign');
          // });
        // }
      }

      function update(isValid) {
        // console.log(vm.item['instructions']);
        // console.log(vm.item.instructions);
        vm.error = null;

        if (!isValid) {
          vm.invalid = true;
          $scope.$broadcast('show-errors-check-validity', 'articleForm');

          return false;
        } else {
          vm.invalid = false;
        }

        console.log(vm.item);
        console.log(vm.item.tagline);
        
        vm.item.$update(function () {
          console.log(vm.item);
          console.log(vm.item.tagline);
          $state.go('company.navbar.template.list');
        }, function (errorResponse) {
          vm.success = null;
          vm.error = errorResponse.data.message;
        });
      }

      function cancel() {
        $state.go('company.navbar.template.list');
      }

      function find() {
        vm.campaigns = TemplateService.template().query({
        }, function() {
          console.log('campaigns found');
        }, function(err) {
          console.log(err);
        });
      }

      function load() {
        vm.success = false;
        console.log('load');

        CampaignService.campaigns().get({
          campaignId: $state.params.templateId
        }, function(val) {
          vm.item = val;
          vm.item.id = null;
          vm.item.status = 0;
          vm.item.name = '';
          vm.item.description = '';
          vm.item.tagline = '';
          vm.item.start = '';
          vm.item.end = '';
        }, function(err) {
          $state.go('landing.default');
        });
      }

      function findOne() {
        vm.success = false;
        // vm.item = null;

        var campaign = TemplateService.template().get({
          campaignId: $state.params.campaignId
        }, function() {
          vm.item = campaign;
          console.log(vm.item);
        }, function(err) {
          $state.go('landing.default');
        });
      }

      function openModal(item) {
        var modalInstance = $modal.open({
          templateUrl: 'modules/core/client/delete-confirmation.html',
          controller: 'DeleteController',
          controllerAs: 'vm',
          resolve: {
            message: function() { return 'Deleting templates is risky business'; }
          }
        });

        modalInstance.result.then(function () {
          remove(item);
        }, function () {
          console.log('Modal dismissed at: ' + new Date());
        });
      }
    }
})();
