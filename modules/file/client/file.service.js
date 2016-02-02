'use strict';

angular
  .module('file')
  .factory('FileService', FileService);

FileService.$inject = ['$resource', '$http', '$q', '$filter', 'Upload'];

function FileService($resource, $http, $q, $filter, FileUpload) {
  var service = {
    listByUser: listByUser,
    files: fileApi,
    authenticate: authenticate,
    upload: upload,
    sha256: sha256
  };

  var photos;
  var videos;
  var files;

  return service;

  function fileApi () {
    return $resource('/api/file/:fileId', {fileId:'@fileId'}, { 'update': {method:'PUT'}, 'query': {method:'GET', isArray:true} } );
  }

  function listByUser () {
    return $resource('/api/user/:userId/file', {userId:'@userId'}, { 'update': {method:'PUT'}, 'query': {method:'GET', isArray:true} } );
  }

  function hashFile(file, chunkSize, onLoad, onProgress) {
    var sha256 = CryptoJS.algo.SHA256.create();
    var size = file.size;
    var offset = 0;
    var chunk = file.slice(offset, offset + chunkSize);

    var hashChunk = function() {
      var reader = new FileReader();
      reader.onload = function(e) {
        // Increment hash
        sha256.update(reader.result);

        // Update offset for next chunk
        offset += chunkSize;

        // Hash next chunk if available
        if(offset < size) {
          // Splice the next Blob from the File
          chunk = file.slice(offset, offset + chunkSize);
          if(onProgress !== null){
            onProgress((offset/size*100).toFixed(1));
          }
          // Recurse to hash next chunk
          console.log('hashChunk - progress - ' + offset);
          hashChunk();
          // Done hashing
        } else {
          // Report digest
          console.log('hashChunk - finished');
          onLoad.call(file, sha256.finalize().toString(CryptoJS.enc.Hex));
        }
      };
      reader.readAsArrayBuffer(chunk);
    };

    // Start hashing chunks
    console.log('hashChunk - start');
    hashChunk();
  }

  function sha256(file){
    var deferred = $q.defer();
    var SHA256 = CryptoJS.algo.SHA256.create();
    var size = file.size;
    var offset = 0;
    var chunkSize = 1048576*10; // 1Mb * 5
    var chunk = file.slice(offset, offset + chunkSize);
    var reader = new FileReader();
    var startTime = +new Date();

    var hashChunk = function(file) {
      var reader = new FileReader();
      reader.onload = function(e) {
      // Increment hash

      if (reader.readyState === FileReader.DONE) { // DONE == 2
        var endTime = +new Date();
        console.log('hashed', file.name, 'in', endTime - startTime, 'ms', reader.result.byteLength, 'len');
        var wordarray = CryptoJS.lib.WordArray.create(reader.result);
        SHA256.update(wordarray);
      }

      // Update offset for next chunk
      offset += chunkSize;

      // Hash next chunk if available
      if(offset < size) {
        // Splice the next Blob from the File
        chunk = file.slice(offset, offset + chunkSize);
        var result = {
          file : file,
          progress : (offset/size*100).toFixed(1)
        };
        deferred.notify(result);
        // Recurse to hash next chunk
        hashChunk(file);
        // Done hashing
      } else {
        // Report digest
        console.log('hashChunk - finished');
        file.hash = SHA256.finalize().toString(CryptoJS.enc.Hex);
        deferred.resolve(file);
      }
    };

      reader.readAsArrayBuffer(chunk);
    };

    // Start hashing chunks
    console.log('hashChunk - start');
    hashChunk(file);

    return deferred.promise;
  }

  FileService.getAllFiles = function(refId, refType){
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/api/file' + '/' + refType + '/' + refId
        }).success(function(data, status, headers, config){
            console.log('fileservice - getAllFiles - success - ' + data.length);
            deferred.resolve(data);
        }).error(function(data, status, headers, config){
            deferred.resolve(false);
        });

        return deferred.promise;
    };

    /*
    Get all files belonging to the current session user
     */
    FileService.getAllUserFiles = function(){
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/api/file/user'
        }).success(function(data, status, headers, config){
            console.log('fileservice - getAllUserFiles - success - ' + data.length);
            files = data;
            photos = $filter('filter')(files, {type:'image'});
            videos = $filter('filter')(files, {type:'video'});
            deferred.resolve(data);
        }).error(function(data, status, headers, config){
            deferred.resolve(false);
        });

        return deferred.promise;
    };

    FileService.allUserFiles = function(){
        return files;
    };

    FileService.allUserPhotos = function(){
        return photos;
    };

    FileService.allUserVideos = function(){
        return videos;
    };

    FileService.verify = function(file, uuid){
        var deferred = $q.defer();

        $http({
            method: 'POST',
            url: '/api/file/verify',
            headers: {'Content-Type': 'application/json'},
            params: {
                'uuid' : uuid
            }
        }).success(function(data, status, headers, config){
            console.log('file verify returned success');
            console.log('type: ' + data.type);
            var result = {file : file, data : data, uuid : uuid, status : true};
            deferred.resolve(result);
        }).error(function(data, status, headers, config){
            console.log('file verify returned error');
            var result = {file : file, uuid : uuid, status : false};
            deferred.reject(result);
        });

        return deferred.promise;
    };

    FileService.addAvatar = function(file, uuid){
        var deferred = $q.defer();

        $http({
            method: 'POST',
            url: '/api/file/avatar',
            headers: {'Content-Type': 'application/json'},
            params: {
                'uuid' : uuid
            }
        }).success(function(data, status, headers, config){
            console.log('add avatar returned success');
            var result = {file : file, data : data, status : true};
            deferred.resolve(result);
        }).error(function(data, status, headers, config){
            console.log('add avatar returned error');
            var result = {file : file, status : false};
            deferred.reject(result);
        });

        return deferred.promise;
    };

  function upload(file, credentials){
    var deferred = $q.defer();
    console.log('upload:', file, credentials);

    FileUpload.upload({
      url: credentials.url, //s3Url
      transformRequest: function(data, headersGetter) {
        var headers = headersGetter();
        delete headers.Authorization;
        return data;
      },
      method: 'POST',
      data: {
        'key': credentials.fields.key,
        'Content-Type': credentials.fields.contentType,
        'acl': credentials.fields.acl,
        'x-amz-meta-uuid': credentials.fields.uuid,
        'x-amz-server-side-encryption': 'AES256',
        'X-Amz-Credential': credentials.fields.credential,
        'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
        'X-Amz-Date': credentials.fields.date,
        'x-amz-meta-tag': '',
        'Policy': credentials.fields.policy,
        'X-Amz-Signature': credentials.fields.signature,
        file: file
      }
    }).progress(function (evt) {
      //var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
      var percentComplete = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
      console.log('progress: ' + percentComplete + '% ');
      var result = {file : file, progress : percentComplete};
      deferred.notify(result);
    }).success(function (data, status, headers, config) {
      console.log('file uploaded. Response: ' + credentials.fields.uuid);
      var result = {file : file, uuid : credentials.fields.uuid, key: credentials.fields.key, url: credentials.url};
      deferred.resolve(result);
    });

    return deferred.promise;
  }

  function authenticate(file){
    var deferred = $q.defer();

    var pos = 0;
    var reader = new FileReader();
    var startTime = +new Date();
//    var hash;

//    service.sha256(file).then(
//      function(file){
        $http({
          method: 'POST',
          url: '/api/file/signature',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
  //          'hash' : file.hash,
            'name' : file.name,
            'length': file.size,
            'type': file.type
          }
        }).success(function(data, status, headers, config){
          var result = {file : file, data : data};
          deferred.resolve(result);
        }).error(function(data, status, headers, config){
          deferred.reject(null);
        });
    return deferred.promise;
  }
}

