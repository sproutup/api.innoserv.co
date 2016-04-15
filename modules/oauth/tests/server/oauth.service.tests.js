'use strict';

/**
 * Module dependencies.
 */

var should = require('should'),
  dynamoose = require('dynamoose'),
  OAuthService = require('modules/oauth/server/oauth.service.js');

/**
 * Globals
 */
var oauth1, oauth2;

/**
 * Unit tests
 */
describe('OAuth Service Unit Tests:', function () {
  before(function () {
    oauth1 = {
      userId: '1234',
      provider: 'fb',
      accessToken: 'token',
      status: 1
    };
    oauth2 = {
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: 'username',
      password: 'password',
      provider: 'local'
    };
  });

  describe('Method Save', function () {
/*
    it('should begin with no oauths', function (done) {
      Oauth.scan({}, function (err, oauths) {
        oauths.should.have.length(0);
        done();
      });
    });

    it('should be able to save without problems', function (done) {
      var _oauth = new Oauth(oauth1);

      OAuthService.saveAccessToken(oauth1.userId, oauth1.provider, oauth1.accessToken, 'test')
        .then(function(result){
          should.exist(result);
          _oauth.delete(function (err) {
            should.not.exist(err);
            done();
          });
        });
    });

  });

*/
  
/*
    it('should fail to save an existing user again', function (done) {
      var _user = new User(user);
      var _user2 = new User(user2);

      User.create(user, function () {
        User.create(user2, function (err) {
          should.exist(err);
          _user.delete(function (err) {
            should.not.exist(err);
            done();
          });
        });
      });
    });

    it('should be able to show an error when try to save without first name', function (done) {
      try {
      User.create(user4, function (err, data) {
        should.exist(err);
        done();
      });
      } catch(err){
        should.exist(err);
        done();
      }
    });

    it('should confirm that saving user model doesnt change the password', function (done) {
      var _user = new User(user);

      _user.save(function (err) {
        should.not.exist(err);
        var passwordBefore = _user.password;
        _user.firstName = 'test';
        _user.save(function (err) {
          var passwordAfter = _user.password;
          passwordBefore.should.equal(passwordAfter);
          _user.delete(function (err) {
            should.not.exist(err);
            done();
          });
        });
      });
    });

    it('should be able to save 2 different users', function (done) {
      var _user = new User(user);
      var _user3 = new User(user3);

      _user.save(function (err) {
        should.not.exist(err);
        _user3.save(function (err) {
          should.not.exist(err);
          _user3.delete(function (err) {
            should.not.exist(err);
            _user.delete(function (err) {
              should.not.exist(err);
              done();
            });
          });
        });
      });
    });

    it('should not be able to save another user with the same email address', function (done) {
      // Test may take some time to complete due to db operations
      this.timeout(10000);

      var _user = new User(user);
      var _user3 = new User(user3);

      _user.delete(function (err) {
        should.not.exist(err);
        _user.save(function (err) {
          should.not.exist(err);
          _user3.email = _user.email;
          _user3.save(function (err) {
            should.exist(err);
            _user.delete(function(err) {
              should.not.exist(err);
              done();
            });
          });
        });
      });

    });

  });

  describe('User E-mail Validation Tests', function() {
    it('should not allow invalid email address - "123"', function (done) {
      var _user = new User(user);

      _user.email = '123';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });

    });

    it('should not allow invalid email address - "123@123"', function (done) {
      var _user = new User(user);

      _user.email = '123@123';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
      
    });

    it('should not allow invalid email address - "123.com"', function (done) {
      var _user = new User(user);

      _user.email = '123.com';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
      
    });

    it('should not allow invalid email address - "@123.com"', function (done) {
      var _user = new User(user);

      _user.email = '@123.com';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
      
    });

    it('should not allow invalid email address - "abc@abc@abc.com"', function (done) {
      var _user = new User(user);

      _user.email = 'abc@abc@abc.com';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
      
    });

    it('should not allow invalid characters in email address - "abc~@#$%^&*()ef=@abc.com"', function (done) {
      var _user = new User(user);

      _user.email = 'abc~@#$%^&*()ef=@abc.com';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
      
    });

    it('should not allow space characters in email address - "abc def@abc.com"', function (done) {
      var _user = new User(user);

      _user.email = 'abc def@abc.com';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
      
    });

    it('should not allow single quote characters in email address - "abc\'def@abc.com"', function (done) {
      var _user = new User(user);

      _user.email = 'abc\'def@abc.com';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
      
    });

    it('should not allow doudble quote characters in email address - "abc\"def@abc.com"', function (done) {
      var _user = new User(user);

      _user.email = 'abc\"def@abc.com';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
      
    });

    it('should not allow double dotted characters in email address - "abcdef@abc..com"', function (done) {
      var _user = new User(user);

      _user.email = 'abcdef@abc..com';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
      
    });

    it('should allow valid email address - "abc@abc.com"', function (done) {
      var _user = new User(user);

      _user.email = 'abc@abc.com';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
      
    });

    it('should allow valid email address - "abc+def@abc.com"', function (done) {
      var _user = new User(user);

      _user.email = 'abc+def@abc.com';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
      
    });

    it('should allow valid email address - "abc.def@abc.com"', function (done) {
      var _user = new User(user);

      _user.email = 'abc.def@abc.com';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
      
    });

    it('should allow valid email address - "abc-def@abc.com"', function (done) {
      var _user = new User(user);

      _user.email = 'abc-def@abc.com';
      _user.save(function (err) {
        if (!err) {
          _user.delete(function (err_remove) {
            should.not.exist(err_remove);
            done();
          });
        } else {
          should.exist(err);
          done();
        }
      });
    });

*/
  });
//  after(function (done) {
//    Oauth.$__.table.delete(function(err){
//      done();
//    });
//  });
});
