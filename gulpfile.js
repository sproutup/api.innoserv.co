'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  defaultAssets = require('./config/assets/default'),
  testAssets = require('./config/assets/test'),
  gulp = require('gulp'),
  glob = require('glob'),
  debug = require('gulp-debug'),
  gulpLoadPlugins = require('gulp-load-plugins'),
  runSequence = require('run-sequence'),
  plugins = gulpLoadPlugins(),
  path = require('path'),
  argv = require('yargs').argv;

// Set NODE_ENV to 'test'
gulp.task('env:test', function () {
  process.env.NODE_ENV = 'test';
});

// Set NODE_ENV to 'development'
gulp.task('env:dev', function () {
  process.env.NODE_ENV = 'development';
});

// Set NODE_ENV to 'production'
gulp.task('env:prod', function () {
  process.env.NODE_ENV = 'production';
});

// Nodemon task
gulp.task('nodemon', function () {
  return plugins.nodemon({
    script: 'server.js',
//    nodeArgs: ['--debug'],
    ext: 'js,html',
    watch: _.union(defaultAssets.server.views, defaultAssets.server.allJS, defaultAssets.server.config)
  });
});

// Watch Files For Changes
gulp.task('watch', function() {
  // Add watch rules
  gulp.watch(defaultAssets.server.gulpConfig, ['jshint']);
  gulp.watch(defaultAssets.server.views).on('change', plugins.livereload.changed);
  gulp.watch(defaultAssets.server.allJS, ['jshint']).on('change', plugins.livereload.changed);
  gulp.watch(defaultAssets.client.views).on('change', plugins.livereload.changed);
  gulp.watch(defaultAssets.client.js, ['jshint']).on('change', plugins.livereload.changed);
  gulp.watch(defaultAssets.client.css, ['csslint']).on('change', plugins.livereload.changed);
  gulp.watch(defaultAssets.client.sass, ['sass', 'csslint']).on('change', plugins.livereload.changed);
  gulp.watch(defaultAssets.client.less, ['less', 'csslint']).on('change', plugins.livereload.changed);

  if (process.env.NODE_ENV === 'test') {
    // Add Server Test file rules
    gulp.watch([testAssets.tests.server, defaultAssets.server.allJS], ['test:server']).on('change', function (file) {
      var runOnlyChangedTestFile = !!argv.onlyChanged;
      // check if we should only run a changed test file
      if (runOnlyChangedTestFile) {
        var changedTestFiles = [];

        // iterate through server test glob patterns
        _.forEach(testAssets.tests.server, function (pattern) {
          // determine if the changed (watched) file is a server test
          _.forEach(glob.sync(pattern), function (f) {
            var filePath = path.resolve(f);

            if (filePath === path.resolve(file.path)) {
              changedTestFiles.push(f);
            }
          });
        });

        // set task argument for tracking changed test files
        argv.changedTestFiles = changedTestFiles;
      }
    });
  }
});

// CSS linting task
gulp.task('csslint', function (done) {
  return gulp.src(defaultAssets.client.css)
    .pipe(plugins.csslint('.csslintrc'))
    .pipe(plugins.csslint.reporter())
    .pipe(plugins.csslint.reporter(function (file) {
      if (!file.csslint.errorCount) {
        done();
      }
    }));
});

// JS linting task
gulp.task('jshint', function () {
  return gulp.src(_.union(defaultAssets.server.gulpConfig, defaultAssets.server.allJS, defaultAssets.client.js, testAssets.tests.server, testAssets.tests.client, testAssets.tests.e2e))
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'))
    .pipe(plugins.jshint.reporter('fail'));
});


// JS minifying task
gulp.task('uglify', function () {
  return gulp.src(defaultAssets.client.js)
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.uglify({
      mangle: false
    }))
    .pipe(plugins.concat('application.min.js'))
    .pipe(gulp.dest('public/dist'));
});

// CSS minifying task
gulp.task('cssmin', function () {
  return gulp.src(defaultAssets.client.css)
    .pipe(plugins.cssmin())
    .pipe(plugins.concat('application.min.css'))
    .pipe(gulp.dest('public/dist'));
});

// Sass task
gulp.task('sass', function () {
  return gulp.src(defaultAssets.client.sass)
    .pipe(plugins.sass())
    .pipe(plugins.rename(function (file) {
      file.dirname = file.dirname.replace(path.sep + 'scss', path.sep + 'css');
    }))
    .pipe(gulp.dest('./modules/'));
});

// Less task
gulp.task('less', function () {
  return gulp.src(defaultAssets.client.less)
    .pipe(plugins.less())
    .pipe(plugins.rename(function (file) {
      file.dirname = file.dirname.replace(path.sep + 'less', path.sep + 'css');
    }))
    .pipe(gulp.dest('./modules/'));
});

// Mocha tests task
gulp.task('peter', function (done) {
  // Open mongoose connections
  var bookshelf = require('./config/lib/bookshelf.js');
  var error;

  bookshelf.loadModels();
  // Connect mongoose
  bookshelf.connect(function() {
    // Run the tests
    return gulp.src(testAssets.tests.server)
      .pipe(plugins.debug())
      .pipe(plugins.mocha())
      .on('error', function (err) {
        // If an error occurs, save it
        console.log('error', err);
        error = err;
      })
      .on('end', function() {
        console.log('end mocha');
        // When the tests are done, disconnect mongoose and pass the error state back to gulp
        bookshelf.disconnect(function() {
          done(error);
        });
      });
  });

});


// Mocha tests task
gulp.task('mocha', function () {
  require('app-module-path').addPath(__dirname);
  var dynamooselib = require('./config/lib/dynamoose');
  return dynamooselib.loadModels().then(function(){
    var error;
    var assets = testAssets.tests.server;

    if(argv.path) {
      assets = [argv.path];
    }

    // Run the tests
    return gulp.src(assets)
      .pipe(debug({title: 'mocha:'}))
      .pipe(plugins.mocha({ reporter: 'spec',
        globals: {
          path: require('app-module-path').addPath(__dirname)
        }}))
      .once('error', () => {
        process.exit(1);
      })
      .once('end', () => {
        process.exit();
      });
//      .on('end', function(){
//        console.log('mocha done');
//        return;
//      });
    });
});

var gutil = require('gulp-util');

gulp.task('mocha2', function() {
  require('app-module-path').addPath(__dirname);
  var dynamoose = require('dynamoose');
  var dynamooselib = require('config/lib/dynamoose');
  /* global -Promise */
  var Promise = require('bluebird');
  var chai = require('chai');
  var should = chai.should;
  var expect = chai.expect;
  var chaiAsPromised = require('chai-as-promised');
  chai.use(chaiAsPromised);

  dynamooselib.loadModels();
  return gulp.src(['modules/slug/tests/server/slug.model.tests.js'], { read: false })
    .pipe(debug({title: 'mocha:'}))
    .pipe(plugins.mocha({
      reporter: 'spec',
      globals: {
        path: require('app-module-path').addPath(__dirname),
        chai: chai,
        expect: expect,
        dynamoose: dynamoose,
        dynamooselib: dynamooselib
//        should: require('should')
      }}))
    .on('error', gutil.log);
});

gulp.task('watch-mocha', function(){
  gulp.watch(defaultAssets.server.allJS, ['env:test', 'jshint', 'mocha2']);
});

// Karma test runner task
gulp.task('karma', function (done) {
  return gulp.src([])
    .pipe(plugins.karma({
      configFile: 'karma.conf.js',
      action: 'run',
      singleRun: true
    }));
});

// Selenium standalone WebDriver update task
gulp.task('webdriver-update', plugins.protractor.webdriver_update);

// Protractor test runner task
gulp.task('protractor', function () {
  gulp.src([])
    .pipe(plugins.protractor.protractor({
      configFile: 'protractor.conf.js'
    }))
    .on('error', function (e) {
      throw e;
    });
});

// Lint CSS and JavaScript files.
gulp.task('lint', function(done) {
  runSequence('less', ['csslint','jshint'], done);
});

// Lint project files and minify them into two production files.
gulp.task('build', function(done) {
  runSequence('env:prod' ,'lint', ['uglify', 'cssmin'], done);
});

gulp.task('test:server', function (done) {
  runSequence('env:test', 'lint', 'mocha', done);
});

// Watch all server files for changes & run server tests (test:server) task on changes
// optional arguments:
//    --onlyChanged - optional argument for specifying that only the tests in a changed Server Test file will be run
// example usage: gulp test:server:watch --onlyChanged
gulp.task('test:server:watch', function (done) {
  runSequence('test:server', 'watch', done);
});

// Run the project tests
gulp.task('test', function(done) {
  runSequence('env:test', ['mocha'], done);
});

// Run the project in development mode
 gulp.task('default', function(done) {
  runSequence('env:dev', 'lint', ['nodemon', 'watch'], done);
});

// Run the project in debug mode
gulp.task('debug', function(done) {
  runSequence('env:dev', 'lint', ['nodemon', 'watch'], done);
});

// Run the project in production mode
gulp.task('prod', function(done) {
  runSequence('build', 'env:prod', 'lint', ['nodemon', 'watch'], done);
});
