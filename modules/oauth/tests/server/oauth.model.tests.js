'use strict';

/**
 * Module dependencies.
 */
//require('app-module-path').addPath(__dirname);
require('config/lib/dynamoose').loadModels();

var should = require('should'),
  dynamoose = require('dynamoose'),
  OAuth = dynamoose.model('oauth');

/**
 * Globals
 */
var oauth1, oauth2;

/**
 * Unit tests
 */
describe('OAuth Model Unit Tests:', function () {

  this.timeout(5000);

  before(function () {
    oauth1 = {
      userId: 1,
      provider: 'fb'
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
    it('Check model with range key', function () {

      OAuth.should.have.property('$__');

      OAuth.$__.name.should.eql('test_oauth');
      OAuth.$__.options.should.have.property('create', true);


      var schema = OAuth.$__.schema;

      should.exist(schema);

      schema.attributes.userId.type.name.should.eql('number');
      should(schema.attributes.userId.isSet).not.be.ok();
      should.not.exist(schema.attributes.userId.default);
      should.not.exist(schema.attributes.userId.validator);
      should(schema.attributes.userId.required).not.be.ok();

      schema.attributes.provider.type.name.should.eql('string');
      schema.attributes.provider.isSet.should.not.be.ok();
      should.not.exist(schema.attributes.provider.default);
      should.not.exist(schema.attributes.provider.validator);
      should(schema.attributes.provider.required).not.be.ok();

      schema.hashKey.should.equal(schema.attributes.userId); // should be same object
      schema.rangeKey.should.equal(schema.attributes.provider);
    });

    it('should begin with no oauths', function (done) {
      OAuth.scan({}, function (err, oauths) {
        oauths.should.have.length(0);
        done();
      });
    });

    it('should be able to save without problems', function (done) {
      //var _oauth = new OAuth(oauth1);
      OAuth.create({userId: 1, provider: 'garfield'}, function(err, data) {
        should.not.exist(err);
        data.delete(function (err) {
          should.not.exist(err);
          done();
        });
      });
    });

  });

  after(function (done) {
    OAuth.$__.table.delete(function(err){
      done();
    });
  });
});



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

  });
*/

