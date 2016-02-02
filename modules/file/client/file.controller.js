'use strict';

//(function() {

angular
  .module('file')
  .controller('FileController', FileController);

FileController.$inject = ['$scope', '$state', 'FileService', '$location', 'Authentication', '$timeout'];

function FileController($scope, $state, FileService, $location, Authentication, $timeout) {
  var vm = this;
  vm.create = create;
  vm.remove = remove;
  vm.update = update;
  vm.cancel = cancel;
  vm.find = find;
  vm.findOne = findOne;
  vm.upload = upload;
  vm.file = null;

  function create(isValid) {
    vm.error = null;

    if (!isValid) {
      vm.invalid = true;
      $scope.$broadcast('show-errors-check-validity', 'fileForm');

      return false;
    } else {
      vm.invalid = false;
    }

    // Create new product object
    var File = FileService.files();
    var file = new File({
      userId: Authentication.user.id,
      name: vm.file.name,
      bucket: vm.file.bucket,
      type: vm.file.type
    });

    // Redirect after save
    file.$save(function (response) {
      $state.go('company.navbar.file.list');

      // Clear form fields
      vm.name = '';
    }, function (errorResponse) {
      console.log(errorResponse);
      vm.error = errorResponse.data.message;
    });
  }

  function remove(file) {
    if (file) {
      file.$remove({
        fileId: file.id
      }, function() {
        $state.go('company.navbar.file.list');
      });

      for (var i in vm.files) {
        if (vm.files[i] === file) {
          vm.files.splice(i, 1);
        }
      }
    }
  }

  function generateThumb(file) {
    if (file !== null) {
      console.log('set thumbnail...found file of type: ' + file.type);
      if (file.type.indexOf('image') > -1) {
        console.log('set thumbnail...reader supported');
        $timeout(function() {
          console.log('set thumbnail...timeout entered');
          var fileReader = new FileReader();
          fileReader.readAsDataURL(file);
          fileReader.onload = function(e) {
            $timeout(function() {
              console.log('set thumbnail url');
              file.dataUrl = e.target.result;
            });
          };
        });
      }
      else
      if (file.type.indexOf('video') > -1) {
        console.log('set thumbnail...reader supported');
        file.dataUrl = '/assets/images/video-thumbnail.png';
      }
    }
  }

  function upload(file){
    console.log('file: ', file);
    vm.file = file;
    generateThumb(file);
    FileService.authenticate(file).then(function (result) {
      console.log('signature returned');
      FileService.upload(result.file, result.data).then(
        function(result){
          console.log('upload returned', result);

          // Create new product object
          var File = FileService.files();
          var item = new File({
            userId: Authentication.user.id,
            name: file.name,
            size: file.size,
            bucket: result.bucket,
            type: result.file.type,
            key: result.key,
            url: result.url + '/' + result.key
          });

          // Redirect after save
          item.$save(function (response) {
            console.log('file saved', response);
            vm.file.dataUrl = null;
            vm.file = item;
            // set in the directive
            vm.model.$setViewValue(item);
            vm.onUpload();
          }, function (errorResponse) {
            console.log(errorResponse);
            vm.error = errorResponse.data.message;
          });
        },
        function (error) {
            // todo handle error
        },
        function (progress) {
            console.log('progress: ', progress);
            file.progress = progress.progress;
        }
      );
    });
  }

  function update(isValid) {
    vm.error = null;

    if (!isValid) {
      vm.invalid = true;
      $scope.$broadcast('show-errors-check-validity', 'articleForm');

      return false;
    } else {
      vm.invalid = false;
    }

    var file = vm.file;

    file.$update({
      fileId: $state.params.fileId
    }, function () {
      $state.go('company.navbar.file.list');
    }, function (errorResponse) {
      vm.success = null;
      vm.error = errorResponse.data.message;
    });
  }

  function cancel() {
    $state.go('company.navbar.file.list');
  }

  function find() {
    console.log('files find');
    vm.files = FileService.listByUser().query({
      userId: Authentication.user.id
    }, function(res) {
      console.log('files found', res);
    }, function(err) {
      console.log(err);
    });
  }

  function findOne() {
    vm.success = false;

    vm.file = FileService.files().get({
      fileId: $state.params.fileId
    }, function() {
      console.log('file found');
    }, function(err) {
      $state.go('landing.default');
    });
  }


}

//})();
