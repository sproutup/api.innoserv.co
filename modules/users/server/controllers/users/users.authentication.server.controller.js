'use strict';

/**
 * Module dependencies.
 */

var url = require('url');
var debug = require('debug')('up:debug:user:auth:ctrl');
var cache = require('config/lib/cache');
var moment = require('moment');
var path = require('path'),
  config = require('config/config'),
  errorHandler = require(path.resolve('./modules/core/server/errors.controller')),
  dynamoose = require('dynamoose'),
  passport = require('passport'),
  sendgrid = require('sendgrid')(config.sendgrid.username, config.sendgrid.pass),
  /* global -Promise */
  Promise = require('bluebird'),
  sendgridService = Promise.promisifyAll(require(path.resolve('./modules/sendgrid/server/sendgrid.service'))),
  User = dynamoose.model('User'),
  Slug = dynamoose.model('Slug'),
  Provider = dynamoose.model('Provider'),
  Company = dynamoose.model('Company'),
  Team = dynamoose.model('Team'),
  _ = require('lodash'),
  redis = require('config/lib/redis'),
  crypto = Promise.promisifyAll(require('crypto'));

// URLs for which user can't be redirected on signin
var noReturnUrls = [
  '/authentication/signin',
  '/authentication/signup'
];

/**
 * Verification email sent after signup
 */
var signedUpEmail = function(user, host) {
  var token;

  crypto.randomBytes(20, function (err, buffer) {
    token = buffer.toString('hex');
    redis.set(token, user.id, 'EX', 86400);

    var url = 'http://' + host + '/api/users/email/confirmation/' + token;
    var to = user.email;
    var subject = 'Amazing.';
    var substitutions = {
      ':user': [user.displayName],
      ':url': [url]
    };

    sendgridService.send(to, subject, substitutions, '7a6240b6-7a2a-4fc2-aed7-d4a6a52cb880');
  });
};

/**
 * Email Verification
 */
var verificationEmail = Promise.method(function(user, host) {
  var token;

  return crypto.randomBytesAsync(20).then(function(buffer) {
    token = buffer.toString('hex');

    var url = 'https://' + host + '/authentication/signup/' + token;
    var to = user.email;
    var subject = 'One Step to Finish Signing Up';
    var substitutions;
    var template;

    if (user.company) {
      substitutions = {
        ':url': [url],
        ':company_name': [user.company.name]
      };
      redis.hmset('token:' + token, { 'email': user.email, 'companyId': user.company.id, 'companyName': user.company.name, 'companySlug': user.company.slug });
      template = 'a97ea7cd-fdd9-4c9d-9f32-e6d7793b8fd2';
    } else {
      substitutions = {
        ':url': [url]
      };
      redis.hmset('token:' + token, { 'email': user.email });
      template = '585fc344-09d7-4bcc-b969-863b70f9b7dc';
    }

    return sendgridService.send(to, subject, substitutions, template);
  });
});

var saveClaimedCompany = function(token, userId) {
  redis.hmget(token, ['companyId']).then(function(result) {
    if (result.length === 1) {
      var teamObj = {
        userId: userId,
        companyId: result[0]
      };

      var item = new Team(teamObj);

      item.save(function (err) {
        if (err) {
          console.log('err saving the team obj');
        } else {
          console.log('saved this team obj', item);
        }
      });
    }
  });

  redis.hdel(token, [ 'email', 'companyId' ]);
};

/**
 * Signup
 */
exports.signup = function (req, res) {
  // For security measurement we remove the roles from the req.body object
  var token = req.body.token;
  delete req.body.token;
  delete req.body.roles;

  // Make sure the the email has only lowercase letters
  if(req.body.email){
    req.body.email = req.body.email.toLowerCase();
  }

  // Init Variables
  var user = req.body;
  var message = null;

  // Add missing user fields
  user.provider = 'local';
  user.displayName = user.firstName + ' ' + user.lastName;
  user.emailConfirmed = true;

  // Then save the user
  User.createWithSlug(user).then(function(newuser) {
    debug('user created: ', newuser.id);
    redis.del('token:' + token);

    req.login(newuser, function (err) {
      if (err) {
        res.status(400).send(err);
      } else {
        res.json(newuser);
      }
    });
  }).catch(function(err){
    return res.status(400).send({
      message: err
    });
  });
};

/**
 * Check if email is available
 */
exports.emailIsAvailable = function (req, res) {
  var email = req.body.email.toLowerCase();

  // return true if its users own email
  if(req.user && req.user.email === email){
    return res.json({result: 1});
  }
  Provider.get({id: email, provider: 'password'}).then(function (result) {
    if (result) {
      return res.json({result: 0});
    } else {
      return res.json({result: 1});
    }
  });
};

/**
 * Join from home page
 */
exports.join = function (req, res) {
  verificationEmail(req.body, req.headers.host)
    .then(function(result) {
      return res.send({
        message: 'Email sent successfully',
        data: result
      });
    })
    .catch(function(error) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(error)
      });
    });
};

/**
 * Send email verification
 * Called from the www sign up flow & profile settings page
 */
exports.sendEmailVerification = function (req, res) {
  var token;
  var url;
  if (!req.user.id) {
    return res.status(400).send({
      message: 'Something is wrong with your session.'
    });
  }

  crypto.randomBytesAsync(20).then(function(buffer) {
    token = buffer.toString('hex');
    redis.hmset('token:' + token, { 'userId': req.user.id, 'email': req.user.email });

    url = 'http://' + req.headers.host + '/i/update-email/' + token;
    var to = req.user.email;
    var subject = 'Confirm Your Email';
    var substitutions = {
      ':user': [req.user.displayName],
      ':url': [url]
    };

    return sendgridService.send(to, subject, substitutions, config.sendgrid.templates.verification);
  }).then(function(result) {
    if (config.sendgrid.local) {
      return res.status(200).send({
        url: url
      });
    } else {
      return res.status(200).send();
    }
  }).catch(function(error) {
    return res.status(400).send({
      message: 'Something went wrong.'
    });
  });
};

/**
 * Verify user's email token, update user, redirect them to the home page
 */
exports.verifyEmailToken = function (req, res) {
  var _cached;
  redis.hgetall('token:' + req.params.token).then(function(result) {
    _cached = result;
    if (!result.email) {
      return res.status(400).send({
        message: 'This token is invalid'
      });
    } else {
      return Promise.join(
        User.update({ id: result.userId }, { email: result.email, emailConfirmed: true }),
        Provider.changeEmail(result.email, result.userId),
        function(user, provider){
          console.log('email updated in user and provider');
        }
      );
    }
  }).then(function(){
    redis.del('token:' + req.params.token);
    cache.del('user:' + _cached.userId);

    if (req.user && req.user.id) {
      User.getCached(req.user.id).then(function(updated){
        req.login(updated, function (err) {
          if (err) {
            return res.status(400).send(err);
          } else {
            res.json(updated);
          }
        });
      });
    } else{
      res.status(200).send();
    }
  }).catch(function(err){
    throw err;
  });
};

/**
 * Return an email and company id from a company token
 */
exports.verifyToken = function (req, res) {
  redis.hmget('token:' + req.body.token, ['email', 'companyId', 'companyName', 'companySlug']).then(function(result) {
    if (result[0] === null) {
      return res.status(400).send({
        message: 'This token is invalid'
      });
    } else {
      return res.jsonp(result);
    }
  }).catch(function(err){
    console.log('err: ', err);
    throw err;
  });
};

/**
 * Return an email and company id from a company token
 */
exports.verifyInviteToken = function (req, res) {
  redis.hmget('token:' + req.body.token, ['invitee', 'inviter', 'companyId']).then(function(result) {
    if (result[0] === null) {
      return res.status(400).send({
        message: 'This token is invalid'
      });
    } else {
      return res.jsonp(result);
    }
  }).catch(function(err){
    console.log('err: ', err);
    throw err;
  });
};

/**
 * Signin after passport authentication
 */
exports.signin = function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err || !user) {
      debug('err: ', err);
      debug('err: ', info);
      res.status(400).send({
        message: 'Authentication credentials provided were invalid'
      });
    } else {
      debug('user authenticated: ', user.username);

      req.login(user, function (err) {
        if (err) {
          res.status(400).send(err);
        } else {
          res.json(user);
        }
      });
    }
  })(req, res, next);
};

/**
 * Signout
 */
exports.signout = function (req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * OAuth provider call
 */
exports.oauthCall = function (strategy, scope) {
  return function (req, res, next) {
    // Set redirection path on session.
    // Do not redirect to a signin or signup page
    if (noReturnUrls.indexOf(req.query.redirect_to) === -1) {
      req.session.redirect_to = req.query.redirect_to;
    }
    // Authenticate
    debug('strategy: ', strategy, scope);
    debug('referer: ', req.headers.referer);

    var tls = (req.headers.referer && req.headers.referer.indexOf('https') === 0);
    var protocol = tls ? 'https' : 'http';
    debug('proto: ', protocol);
    req.headers['x-forwarded-proto'] = protocol;
    req.headers['x-forwarded-host'] = req.headers['x-up-proxy-host'];
//    if(req.headers.referer){
//      var fields = url.parse(req.headers.referer);
//      debug('host: ', fields.host);
//      req.headers['x-forwarded-host'] = fields.host;
//    }
    debug('x-forwarded-proto: ', req.headers['x-forwarded-proto']);
    debug('x-forwarded-host: ', req.headers['x-forwarded-host']);
    passport.authenticate(strategy, scope)(req, res, next);
  };
};

/**
 * OAuth callback
 */
exports.oauthCallback = function (strategy) {
  return function (req, res, next) {
    // Pop redirect URL from session
    debug('strategy: ', strategy);
    debug('referer: ', req.headers.referer);

    var sessionRedirectURL = req.session.redirect_to;
    delete req.session.redirect_to;

    var tls = (req.headers.referer && req.headers.referer.indexOf('https') === 0);
    var protocol = tls ? 'https' : 'http';
    debug('proto: ', protocol);
    req.headers['x-forwarded-proto'] = protocol;
    req.headers['x-forwarded-host'] = req.headers['x-up-proxy-host'];
//    if(req.headers.referer){
//      var fields = url.parse(req.headers.referer);
//      debug('host: ', fields.host);
//      req.headers['x-forwarded-host'] = fields.host;
//    }
    debug('x-up-proxy-header: ', req.headers['x-up-proxy-host']);
    debug('x-forwarded-proto: ', req.headers['x-forwarded-proto']);
    debug('x-forwarded-host: ', req.headers['x-forwarded-host']);

    passport.authenticate(strategy, function (err, user, redirectURL) {
      if (err) {
        debug(err.name + ': ' + err.message);
        return res.redirect('/authentication/signin?err=' + encodeURIComponent(err.message));
      }
      if (!user) {
        return res.redirect('/authentication/signin');
      }
      req.login(user, function (err) {
        if (err) {
          return res.redirect('/authentication/signin');
        }
        if (_.isEmpty(redirectURL)) redirectURL = null;
        if(req.newAuthUser){
          redirectURL = '/welcome';
        }
        debug('redirect: ', redirectURL ||  sessionRedirectURL || '/');
        return res.redirect(redirectURL || sessionRedirectURL || '/');
      });
    })(req, res, next);
  };
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
  var user;
  var _provider = providerUserProfile.provider;
  var _identifier = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

  if (!req.user) {
    Provider.get({id: _identifier, provider: _provider}, function (err, provider) {
      if (err) {
        console.log('err: ', err);
        return done(err);
      } else {
        if (!provider) {
          debug('provider ', _provider, ' not found -> new user');
          // this is a new user signup
          req.newAuthUser = true;

          var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');
          debug('possible username: ', possibleUsername);

          Slug.findUniqueSlug(possibleUsername).then(function (availableUsername) {
            user = {
              firstName: providerUserProfile.firstName,
              lastName: providerUserProfile.lastName,
              username: availableUsername,
              displayName: providerUserProfile.displayName,
              email: providerUserProfile.email,
              provider: _provider,
              profileImageURL: providerUserProfile.profileImageURL
            };

            var time = moment().subtract(1,'day').utc().startOf('day').unix();
            var provider = new Provider({
              id: _identifier,
              provider: _provider,
              email: providerUserProfile.email,
              profileImageURL: providerUserProfile.profileImageURL,
              data: providerUserProfile.providerData,
              status: 1,
              timestamp: time // force refresh services
            });

            // And save the user
            return User.createWithSlug(user).then(function (newuser) {
              provider.userId = newuser.id;
              provider.save(function (err){
                if (newuser.email) {
                  // Send email verification
                  crypto.randomBytesAsync(20).then(function(buffer) {
                    var token = buffer.toString('hex');
                    redis.hmset('token:' + token, { 'userId': newuser.id, 'email': newuser.email });

                    url = 'http://' + req.headers.host + '/i/update-email/' + token;
                    var to = newuser.email;
                    var subject = 'Confirm Your Email';
                    var substitutions = {
                      ':user': [newuser.displayName],
                      ':url': [url]
                    };

                    return sendgridService.send(to, subject, substitutions, config.sendgrid.templates.verification);
                  });
                }

                return done(err, newuser);
              });
            });
          });
        } else {
          debug('provider ', _provider, ' found -> login user');
          User.getCached(provider.userId).then(function(user){
            debug('user: ', user.id, ' name: ', user.displayName);
            return done(null, user);
          })
          .catch(function(err){
            return done(err, null);
          });
        }
      }
    });
  } else {
    debug('User is already logged in, join the provider data to the existing user');
    user = req.user;
    var time = moment().subtract(1,'day').utc().startOf('day').unix();

    Provider.get({id: _identifier, provider: _provider}, function (err, provider) {
      if (err) {
        console.log('err: ', err);
        return done(err);
      } else {
        // provider not found -> add to user
        if (!provider) {
          debug('add ', _provider, ' provider to user: ', user.id);
          provider = new Provider({
            id: _identifier,
            provider: _provider,
            userId: user.id,
            email: providerUserProfile.email,
            profileImageURL: providerUserProfile.profileImageURL,
            data: providerUserProfile.providerData,
            status: 1,
            timestamp: time
          });

          // And save the provider
          provider.save(function (err){
            return done(err, user);
          });
        }
        // provider found -> don't add the provider again
        else{
          if(_provider !== 'twitter' && _provider !== 'facebook') {
            debug('Someone is already connected with this ' + _provider + ' account -> move provider to this account');
            Provider.update({id: _identifier, provider: _provider}, {userId: user.id}).then(function(){
              return done(null, user);
            });
          }
          else {
            debug('Someone is already connected with this ' + _provider + ' account -> dont add the provider again');
            return done(new Error('Connection is not successful, because another SproutUp user – most likely another account of yours – is already connected with this ' + _provider + ' account.'), user);
          }
        }
      }
    });
  }
};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function (req, res, next) {
  var user = req.user;
  var provider = req.query.provider;

  if (!user) {
    return res.status(401).json({
      message: 'User is not authenticated'
    });
  } else if (!provider) {
    return res.status(400).send();
  }

  Provider.queryOne('userId').eq(user.id).where('provider').eq(provider).exec().then(function (item) {
    debug('remove oauth provider ' +  item.provider + ' - ' + item.id);
    item.purge().then(function(){
      req.login(user, function (err) {
        if (err) {
          return res.status(400).send(err);
        } else {
          return res.json(user);
        }
      });
    });
  }).catch(function(err){
    console.log('err: ', err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};
