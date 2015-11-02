'use strict';

var moment = require('moment');
var _ = require('underscore');
var googleapi = require('config/lib/googleapi');
//var analytics = google.analytics('v3');
//var youtube = google.youtube('v3');

var GoogleService = function() {
};

GoogleService.validate = function(){
  
};

module.exports = GoogleService;

/*
var AnalyticsAccount = Bookshelf.Model.extend({
    tableName: "analytics_account",
    hasTimestamps: true,

    analyticsAccountSummary: function() {
        // one-to-many         
        this.hasMany('AnalyticsAccountSummary');
    },

    getAll: function () {
        console.log("## check for new accounts  ##");
        Bookshelf.model('AnalyticsAccountCollection')
            .forge()
            //.where({is_valid: 0})
            //.query('where', 'is_valid', '=', '0')
            .fetch()
            .then(function (result) {
                return{
                    result: result
                }
            })
            .catch(function (err) {
                console.log('error');
            });
    },

    update: function() {
        oauth2Client.setCredentials({
            access_token: this.get('access_token'),
            refresh_token: this.get('refresh_token')
        });

        console.log("update account: ", this.id);
        if(this.get('google_analytics_api') == 1) {
            this.updateAccountSummary();
        } 
        if(this.get('youtube_analytics_api') == 1) {
            console.log("youtube");
            this.updateYoutubeChannels();
        } 
    },

    validate: function(callback) {
        
        callback = (typeof callback === 'function') ? callback : function() {};

        var self = this;
        
        console.log('validate account', this.get('id'));
        var account = this;
        oauth2Client.setCredentials({
            access_token: this.get('access_token'),
            refresh_token: this.get('refresh_token')
        });

        if(moment().isAfter(this.get('expires_at'))){
            console.log('expired access token - needs refresh');
            oauth2Client.refreshAccessToken(function(err, tokens) {
                // your access_token is now refreshed and stored in oauth2Client
                // store these new tokens in a safe place (e.g. database)
                if(err){
                    console.log('Encountered error', err);
                    account.set('error_message', err.message);
                    account.set('is_valid', 0);
                    account.save();
                    callback(err);
                }
                else{
               
                    console.log("tokens", tokens);
                    account.set('access_token', tokens.access_token);
                    account.set('updated_at', moment().toDate());
                    account.set('expires_at', moment(tokens.expiry_date).toDate());
                    account.set('is_valid', 1);
                    account.set('error_message', '');
                    account.save().then(function(){
                        callback(null, 'saved')
                    });
                }
            });
        }
        else{
            console.log("access token still valid");
            callback(null, 'valid token');
       }
    },

*/
