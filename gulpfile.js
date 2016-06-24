var $        = require('gulp-load-plugins')();
var argv     = require('yargs').argv;
var browser  = require('browser-sync');
var gulp     = require('gulp');
var panini   = require('panini');
var rimraf   = require('rimraf');
var sequence = require('run-sequence');
var sherpa   = require('style-sherpa');
var minify   = require('gulp-minify');
var fileinclude = require('gulp-file-include');
var modRewrite = require('connect-modrewrite');
// Check for --production flag
var isProduction = !!(argv.production);


// Port to use for the development server.
var PORT = 8000;

// Browsers to target when prefixing CSS.
var COMPATIBILITY = ['last 2 versions', 'ie >= 9'];

// File paths to various assets are defined here.
var PATHS = {
  data: [
    'src/data/**/*',
  ],
  assets: [
    'src/assets/**/*',
    '!src/assets/{!img,js,scss}/**/*'
  ],
  sass: [
    'bower_components/foundation-sites/scss',
    'bower_components/motion-ui/src/',
    'bower_components/angular-loading-bar/src/loading-bar.css'
  ],

  angular_core:[
    'node_modules/angular/angular.js',
    'bower_components/angular-route/angular-route.min.js',
    'bower_components/angular-ui-router/release/angular-ui-router.min.js',
    'bower_components/ng-prettyjson/dist/ng-prettyjson.min.js',
    'bower_components/angular-breadcrumb/release/angular-breadcrumb.js',
    'node_modules/angular-sanitize/angular-sanitize.js',
    'bower_components/oclazyload/dist/ocLazyLoad.min.js',
    'bower_components/angular-loading-bar/build/loading-bar.js',
  ],
  foundation_sites:[
    'bower_components/foundation-sites/js/foundation.core.js',
    'bower_components/foundation-sites/js/foundation.util.*.js',
    // Paths to individual JS components defined below
    'bower_components/foundation-sites/js/foundation.abide.js',
    'bower_components/foundation-sites/js/foundation.accordion.js',
    'bower_components/foundation-sites/js/foundation.accordionMenu.js',
    'bower_components/foundation-sites/js/foundation.drilldown.js',
    'bower_components/foundation-sites/js/foundation.dropdown.js',
    'bower_components/foundation-sites/js/foundation.dropdownMenu.js',
    'bower_components/foundation-sites/js/foundation.equalizer.js',
    'bower_components/foundation-sites/js/foundation.interchange.js',
    'bower_components/foundation-sites/js/foundation.magellan.js',
    'bower_components/foundation-sites/js/foundation.offcanvas.js',
    'bower_components/foundation-sites/js/foundation.orbit.js',
    'bower_components/foundation-sites/js/foundation.responsiveMenu.js',
    'bower_components/foundation-sites/js/foundation.responsiveToggle.js',
    'bower_components/foundation-sites/js/foundation.reveal.js',
    'bower_components/foundation-sites/js/foundation.slider.js',
    'bower_components/foundation-sites/js/foundation.sticky.js',
    'bower_components/foundation-sites/js/foundation.tabs.js',
    'bower_components/foundation-sites/js/foundation.toggler.js',
    'bower_components/foundation-sites/js/foundation.tooltip.js',
  ],
  jquery:[
    'src/assets/js/jquery-1.11.3.min.js',
    'src/assets/js/jquery.colorbox-min.js',
    'src/assets/js/jquery-ui.min.js',
    'src/assets/js/jquery.colorbox-min.js',
  ],
  custom:[
    'src/assets/js/angular/app-configure.js',
    'src/assets/js/angular/app-route.js',
    'src/assets/js/angular/Controllers/*.js',
    'src/assets/js/angular/Class/*.js',

    //'src/assets/js/angular/Directives/*.js',

  ],
  blaa:[
    /*'src/assets/js/interface.js',
    'src/assets/js/prefixfree.min.js',
    'src/assets/js/jquery.cycle2.min.js',
    'src/assets/js/jquery.jplayer.min.js*/
  ]
};
// Delete the "dist" folder
// This happens every time a build starts
gulp.task('clean', function(done) {
  rimraf('dist', done);
});
// allow @nclude in templates
gulp.task('fileinclude', function() {
  gulp.src('src/templates/**/*.html')
    .pipe(fileinclude({
          prefix: '@@',
          basepath: '@file'
    }))
    .pipe(gulp.dest('dist/templates'));
});
// Copy files out of the assets folder
// This task skips over the "img", "js", and "scss" folders, which are parsed separately
gulp.task('copy', function() {
  gulp.src(PATHS.assets)
    .pipe(gulp.dest('dist/assets'));
  gulp.src('src/includes/**/*')
    .pipe(gulp.dest('dist/includes'));
});
gulp.task('copy', function() {
  gulp.src(PATHS.data)
    .pipe(gulp.dest('dist/assets/data'));
});
// Copy page templates into finished HTML files
gulp.task('pages', function() {
  gulp.src('src/pages/*.{html,hbs,handlebars}')
    .pipe(panini({
      root: 'src/pages',
      layouts: 'src/layouts/',
      partials: 'src/templates/**/**/*',
      data: 'src/data/',
      helpers: 'src/helpers/'
    }))
    .pipe(gulp.dest('dist'));
});
gulp.task('pages:reset', function(cb) {
  panini.refresh();
  gulp.run('pages');
  cb();
});
gulp.task('styleguide', function(cb) {
  sherpa('src/styleguide/index.md', {
    output: 'dist/styleguide.html',
    template: 'src/styleguide/template.html'
  }, cb);
});
// Compile Sass into CSS
// In production, the CSS is compressed
gulp.task('sass', function() {
  var uncss = $.if(isProduction, $.uncss({
    html: ['src/**/*.html'],
    ignore: [
      new RegExp('^meta\..*'),
      new RegExp('^\.is-.*')
    ]
  }));
  var minifycss = $.if(isProduction, $.minifyCss());

  return gulp.src('src/assets/scss/app.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: PATHS.sass
    })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: COMPATIBILITY
    }))
    .pipe(uncss)
    //.pipe(minifycss)
    .pipe($.minifyCss())
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/assets/css'));
});
// Combine JavaScript into one file
// In production, the file is minified
gulp.task('javascript_angular', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));
  return gulp.src(PATHS.angular_core)
    .pipe($.sourcemaps.init())
    .pipe($.concat('angular_core.js'))
    //.pipe(minify({}))
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/assets/js'));
});
gulp.task('javascript_foundation', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));
  return gulp.src(PATHS.foundation_sites)
    .pipe($.sourcemaps.init())
    .pipe($.concat('foundation_sites.js'))
    //.pipe(minify({}))
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/assets/js'));
});
gulp.task('javascript_jquery', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));
  return gulp.src(PATHS.jquery)
    .pipe($.sourcemaps.init())
    .pipe($.concat('jquery.js'))
    //.pipe(minify({}))
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/assets/js'));
});
gulp.task('javascript_custom', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));
  return gulp.src(PATHS.custom)
    .pipe($.sourcemaps.init())
    .pipe($.concat('app.js'))
    //.pipe(minify({}))
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/assets/js'));
});
gulp.task('javascript_blaa', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));
  return gulp.src(PATHS.blaa)
    .pipe($.sourcemaps.init())
    .pipe($.concat('blaa.js'))
    //.pipe(minify({}))
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/assets/js'));
});

// Copy images to the "dist" folder
// In production, the images are compressed
gulp.task('images', function() {
  var imagemin = $.if(isProduction, $.imagemin({
    progressive: true
  }));
  return gulp.src('src/assets/img/**/*')
    .pipe(imagemin)
    .pipe(gulp.dest('dist/assets/img'));
});
// Build the "dist" folder by running all of the above tasks
gulp.task('build', function(done) {
  sequence('clean', ['fileinclude','pages', 'sass','javascript_angular','javascript_foundation','javascript_jquery','javascript_custom','javascript_blaa', 'images', 'copy'], 'styleguide', done);
});
// Start a server with LiveReload to preview the site in
gulp.task('server', ['build'], function() {
  browser.init({
    server: 'dist',
    port: PORT,
    middleware: [
      modRewrite([
        '!\\.\\w+$ /index.html [L]'
      ])
    ]
  });
});
// Build the site, run the server, and watch for file changes
gulp.task('default', ['build', 'server'], function() {
  gulp.watch('src/templates/**/*.html', ['fileinclude', browser.reload]);
  gulp.watch(PATHS.assets, ['copy', browser.reload]);
  gulp.watch(PATHS.data, ['copy', browser.reload]);
  gulp.watch(['src/pages/**/*.html'], ['pages', browser.reload]);
  gulp.watch(['src/{layouts,partials}/**/*.html'], ['pages:reset', browser.reload]);
  gulp.watch(['src/includes/*/*.html'], ['pages:reset', browser.reload]);
  gulp.watch(['src/assets/scss/**/*.scss'], ['sass', browser.reload]);
  gulp.watch(['src/assets/js/**/*.js'], ['javascript_angular', browser.reload]);
  gulp.watch(['src/assets/js/**/*.js'], ['javascript_foundation', browser.reload]);
  gulp.watch(['src/assets/js/**/*.js'], ['javascript_jquery', browser.reload]);
  gulp.watch(['src/assets/js/**/*.js'], ['javascript_custom', browser.reload]);
  gulp.watch(['src/assets/js/**/*.js'], ['javascript_blaa', browser.reload]);
  gulp.watch(['src/assets/img/**/*'], ['images', browser.reload]);
  gulp.watch(['src/styleguide/**'], ['styleguide', browser.reload]);
});
