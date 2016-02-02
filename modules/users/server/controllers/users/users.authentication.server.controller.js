'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require('config/config'),
  errorHandler = require(path.resolve('./modules/core/server/errors.controller')),
  dynamoose = require('dynamoose'),
  passport = require('passport'),
  sendgrid = require('sendgrid')(config.sendgrid.username, config.sendgrid.pass),
  sendgridService = require(path.resolve('./modules/sendgrid/server/sendgrid.service')),
  User = dynamoose.model('User'),
  Company = dynamoose.model('Company'),
  Team = dynamoose.model('Team'),
  _ = require('lodash'),
  redis = require('config/lib/redis'),
  crypto = require('crypto');

// URLs for which user can't be redirected on signin
var noReturnUrls = [
  '/authentication/signin',
  '/authentication/signup'
];

/**
 * Verification email sent after signup
 * This will be refactored with new sendgrid function
 */
var signedUpEmail = function(user, callback, host) {
  var token;

  crypto.randomBytes(20, function (err, buffer) {
    token = buffer.toString('hex');

    var url = 'http://' + host + '/api/users/email/confirmation/' + token;
    var email = new sendgrid.Email();
    email.subject = 'Amazing.';
    email.from = 'mailer@sproutup.co';
    email.fromname = 'SproutUp';
    email.html = '<div></div>';
    email.addTo(user.email);
    email.addSubstitution(':user', user.displayName);
    email.addSubstitution(':url', url);
    redis.set(token, user.id, 'EX', 86400);
    // TODO -- pass in the email and the template, instead of the email, template and the url 
    sendgridService.send(email, '7a6240b6-7a2a-4fc2-aed7-d4a6a52cb880', url);
  });
};

/**
 * Email Verification
 */
var verificationEmail = function(user, callback, host) {
  var token;

  crypto.randomBytes(20, function (err, buffer) {
    token = buffer.toString('hex');

    var url = 'http://' + host + '/authentication/signup/' + token;
    var email = new sendgrid.Email();
    email.subject = 'One Step to Finish Signing Up';
    email.from = 'mailer@sproutup.co';
    email.fromname = 'SproutUp';
    email.html = '<div></div>';
    email.addTo(user.email);
    email.addSubstitution(':url', url);
    if (user.company) {
      email.addSubstitution(':company_name', user.company.name);
      redis.hmset(token, {'email': user.email, 'companyId': user.company.id, 'companyName': user.company.name, 'companySlug': user.company.slug });
      sendgridService.send(email, 'a97ea7cd-fdd9-4c9d-9f32-e6d7793b8fd2', url, callback);
    } else {
      redis.hmset(token, { 'email': user.email });
      sendgridService.send(email, '585fc344-09d7-4bcc-b969-863b70f9b7dc', url, callback);
    }
    
  });
};

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
  delete req.body.roles;

  // Make sure the the email has only lowercase letters
  req.body.email = req.body.email.toLowerCase();

  // Init Variables
  var user = new User(req.body);
  var message = null;

  // Add missing user fields
  user.provider = 'local';
  user.displayName = user.firstName + ' ' + user.lastName;

  // Then save the user
  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;

      signedUpEmail(user, null, req.headers.host);

      // If the user is claiming a company, save a team obj, then remove the token
      if (req.body.token) {
        saveClaimedCompany(req.body.token, user.id);
      }

      req.login(user, function (err) {
        if (err) {
          res.status(400).send(err);
        } else {
          res.json(user);
        }
      });
    }
  });
};

/**
 * Check if email is available
 */
exports.emailIsAvailable = function (req, res) {
  var email = req.body.email.toLowerCase();
  User.queryOne('email').eq(email).exec().then(function(result) {
    if (result) {
      return res.json({result: 0});
    } else {
      var domain = email.substring(email.lastIndexOf('@')+1, email.length);
      console.log('domain:', domain);
      Company.queryOne('domain').eq(domain).exec().then(function(company){
        console.log('res:',company);
        return res.json({
          result: 1,
          company: company
        });
      })
      .catch(function(err){
        console.log('err: ', err);
      });
    }
  })
  .catch(function(err){
    console.log(err);
  });
};

/**
 * Join from home page
 */
exports.join = function (req, res) {
  verificationEmail(req.body, function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      return res.send({
        message: 'Email sent successfully'
      });
    }
  }, req.headers.host);
};

/**
 * Return an email and company id from a company token 
 */
exports.verifyToken = function (req, res) {
  redis.hmget(req.body.token, ['email', 'companyId', 'companyName', 'companySlug']).then(function(result) {
    if (result[0] === null) {
      return res.status(400).send({
        message: 'This token is invalid'
      });
    } else {
      return res.jsonp(result);
    }
  });

};

/**
 * Signin after passport authentication
 */
exports.signin = function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err || !user) {
      res.status(400).send(info);
    } else {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;

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
  res.redirect('/authentication/signin');
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
    passport.authenticate(strategy, scope)(req, res, next);
  };
};

/**
 * OAuth callback
 */
exports.oauthCallback = function (strategy) {
  return function (req, res, next) {
    // Pop redirect URL from session
    var sessionRedirectURL = req.session.redirect_to;
    delete req.session.redirect_to;

    passport.authenticate(strategy, function (err, user, redirectURL) {
      if (err) {
        return res.redirect('/authentication/signin?err=' + encodeURIComponent(errorHandler.getErrorMessage(err)));
      }
      if (!user) {
        return res.redirect('/authentication/signin');
      }
      req.login(user, function (err) {
        if (err) {
          return res.redirect('/authentication/signin');
        }

        return res.redirect(redirectURL || sessionRedirectURL || '/');
      });
    })(req, res, next);
  };
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
  if (!req.user) {
    // Define a search query fields
    var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
    var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

    // Define main provider search query
    var mainProviderSearchQuery = {};
    mainProviderSearchQuery.provider = providerUserProfile.provider;
    mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define additional provider search query
    var additionalProviderSearchQuery = {};
    additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

    // Define a search query to find existing user with current provider profile
    var searchQuery = {
      $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
    };

    User.findOne(searchQuery, function (err, user) {
      if (err) {
        return done(err);
      } else {
        if (!user) {
          var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');

          User.findUniqueUsername(possibleUsername, null, function (availableUsername) {
            user = new User({
              firstName: providerUserProfile.firstName,
              lastName: providerUserProfile.lastName,
              username: availableUsername,
              displayName: providerUserProfile.displayName,
              email: providerUserProfile.email,
              profileImageURL: providerUserProfile.profileImageURL,
              provider: providerUserProfile.provider,
              providerData: providerUserProfile.providerData
            });

            // And save the user
            user.save(function (err) {
              return done(err, user);
            });
          });
        } else {
          return done(err, user);
        }
      }
    });
  } else {
    // User is already logged in, join the provider data to the existing user
    var user = req.user;

    // Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
    if (user.provider !== providerUserProfile.provider && (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
      // Add the provider data to the additional provider data field
      if (!user.additionalProvidersData) {
        user.additionalProvidersData = {};
      }

      user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

      // Then tell mongoose that we've updated the additionalProvidersData field
      user.markModified('additionalProvidersData');

      // And save the user
      user.save(function (err) {
        return done(err, user, '/settings/accounts');
      });
    } else {
      return done(new Error('User is already connected using this provider'), user);
    }
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

  // Delete the additional provider
  if (user.additionalProvidersData[provider]) {
    delete user.additionalProvidersData[provider];

    // Then tell mongoose that we've updated the additionalProvidersData field
    user.markModified('additionalProvidersData');
  }

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      req.login(user, function (err) {
        if (err) {
          return res.status(400).send(err);
        } else {
          return res.json(user);
        }
      });
    }
  });
};
