'use strict';

/**
 * Module dependencies.
 */
var dynamoose = require('dynamoose'),
  Schema = dynamoose.Schema,
  crypto = require('crypto'),
  FlakeId = require('flake-idgen'),
  flakeIdGen = new FlakeId(),
  intformat = require('biguint-format'),
  validator = require('validator');

/**
 * A Validation function for local strategy properties
 */
var validateLocalStrategyProperty = function (property) {
  return ((this.provider !== 'local' && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy password
 */
var validateLocalStrategyPassword = function (password) {
  return (this.provider !== 'local' || validator.isLength(password, 6));
};

/**
 * A Validation function for local strategy email
 */
var validateLocalStrategyEmail = function (email) {
  var User = dynamoose.model('User');
//  User.findEmail(email, function(err, user){
//    if(user) {
//      console.log('email exists');
//      return false;
//    }
//  });
  return ((this.provider !== 'local' && !this.updated) || validator.isEmail(email));
};

/**
 * User Schema
 */
var UserSchema = new Schema({
  id: {
    type: String,
    default: function(){ return intformat(flakeIdGen.next(), 'dec'); },
    hashKey: true
  },
  username: {
    type: String,
    // required: true,
    trim: true,
  },
  firstName: {
    type: String,
    trim: true,
    required: true,
    default: '',
    validate: validateLocalStrategyProperty
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
    validate: validateLocalStrategyProperty
  },
  displayName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: '',
    validate: validateLocalStrategyEmail,
    index: {
      global: true,
      project: true,
      name: 'emailGlobalIndex'
    }
  },
  password: {
    type: String,
    default: '',
    validate: validateLocalStrategyPassword
  },
  salt: {
    type: String
  },
  hash: {
    type: String
  },
  avatar: {
    fileId: {
      type: String
    }
  },
  profileImageURL: {
    type: String,
    default: 'modules/core/client/img/default-avatar.png'
  },
  provider: {
    type: String,
    required: 'Provider is required'
  },
  providerData: {},
  additionalProvidersData: {},
  roles: {
    type: [{
      type: String,
      enum: ['user', 'admin']
    }],
    default: ['user']
  },
  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  },
  /* For reset password */
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  emailConfirmed: {
    type: Boolean
  }
});

/**
 * Create instance method for hashing a password
 */
UserSchema.method('hashPassword', function (password) {
  if (this.salt && password) {
    return crypto.pbkdf2Sync(password, new Buffer(this.salt, 'base64'), 10000, 64).toString('base64');
  } else {
    return password;
  }
});

/**
 * Create instance method for authenticating user
 */
UserSchema.method('populate', function (path) {
  var _this = this;
  console.log('populate: ', path);
  return _this;
});


/**
 * Create instance method for authenticating user
 */
UserSchema.method('authenticate', function (password) {
  return this.hash === this.hashPassword(password);
});

/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = function (username, suffix, callback) {
  var _this = this;
  var possibleUsername = username + (suffix || '');

  _this.findOne({
    username: possibleUsername
  }, function (err, user) {
    if (!err) {
      if (!user) {
        callback(possibleUsername);
      } else {
        return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
      }
    } else {
      callback(null);
    }
  });
};

UserSchema.statics.findEmail = function (email, callback) {
  var _this = this;

  _this.query('email').eq(email).limit(1).exec(function(err, user){
    console.log('user:', user);
    console.log('err:', err);
    return true;
  });
};

var User = dynamoose.model('User', UserSchema);

/**
 * Hook a pre save method to hash the password
 */
User.pre('save', function(next) {
  if (this.password) {
    this.salt = crypto.randomBytes(16).toString('base64');
    this.hash = this.hashPassword(this.password);
    this.password = '';
  }

  // new user check email
//  if (!this.id){
//    User.get({email: this.email});
//  }

  next();
});



