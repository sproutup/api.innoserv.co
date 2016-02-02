'use strict';

var config = require('config/config');
var CryptoJS = require('crypto-js');
var moment = require('moment');
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var intformat = require('biguint-format');
var mime = require('mime');

var accessKeyID = config.aws.accessKeyID;
var secretAccessKey = config.aws.secretAccessKey;
var bucket = config.aws.s3.bucket;
var region = config.aws.s3.region;
var serviceName = 's3';

var S3Service = function(){
};

S3Service.getBase64Policy = function(policy){
  var base64Policy = new Buffer(JSON.stringify(policy), 'utf-8').toString('base64');
  return base64Policy;
};

S3Service.getSignatureKey = function(key, dateStamp, regionName, serviceName) {
   var kDate = CryptoJS.HmacSHA256(dateStamp, 'AWS4' + key);
   var kRegion = CryptoJS.HmacSHA256(regionName, kDate);
   var kService = CryptoJS.HmacSHA256(serviceName, kRegion);
   var kSigning = CryptoJS.HmacSHA256('aws4_request', kService);
   return kSigning;
};

S3Service.getSignature = function(file, user) {
  var folder = 'users/' + user.id + '/'; // overwrite with your folder
  var expiration = moment().add(15, 'm').toISOString();
  var date = moment().format('YYYYMMDD');
  var uuid = intformat(flakeIdGen.next(), 'dec');
  var amzcredential = accessKeyID + '/' + date + '/' + region + '/' + serviceName + '/aws4_request';

  var s3Policy = {
    'expiration': expiration,
    'conditions': [
      {'bucket': bucket},
      ['starts-with', '$key', folder],
      {'acl': 'public-read'},
      ['starts-with', '$Content-Type', 'image/'],
      {'x-amz-meta-uuid': uuid},
      {'x-amz-server-side-encryption': 'AES256'},
      ['starts-with', '$x-amz-meta-tag', ''],
      {'x-amz-credential': accessKeyID + '/' + date + '/' + region + '/' + serviceName +'/aws4_request'},
      {'x-amz-algorithm': 'AWS4-HMAC-SHA256'},
      {'x-amz-date': date + 'T000000Z'}
    ]
  };

  var base64Policy = S3Service.getBase64Policy(s3Policy);
  var signatureKey = S3Service.getSignatureKey(secretAccessKey, date, region, serviceName);

  var credentials = {
    url: 'https://' + bucket + '.s3-' + region + '.amazonaws.com',
    fields: {
      key: 'users/' + user.id + '/' + uuid + '.' + mime.extension(file.type),
      AWSAccessKeyId: accessKeyID,
      acl: 'public-read',
      policy: base64Policy,
      signature: CryptoJS.HmacSHA256(base64Policy, signatureKey).toString(CryptoJS.enc.Hex),
      contentType: file.type,
      uuid: uuid,
      credential: amzcredential,
      success_action_status: 201,
      date: date + 'T000000Z'
    }
  };

  return credentials;
};

module.exports = S3Service;

