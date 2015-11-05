var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del');

gulp.task('default', ['clean'], function() {
    gulp.start('styles', 'scripts', 'images');
});

gulp.task('styles', function() {
    return sass('resources/sass/app.scss', { style: 'expanded' })
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('app/assets/css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest('app/assets/css'))
        .pipe(notify({ message: 'Styles task complete' }));
});
gulp.task('scripts', function() {
    return gulp.src('resources/scripts/**/*.js')
        //.pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(concat('app.js'))
        .pipe(gulp.dest('app/assets/js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('app/assets/js'))
        .pipe(notify({ message: 'Scripts task complete' }));
});
gulp.task('images', function() {
    return gulp.src('resources/images/**/*')
        .pipe(cache(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
        .pipe(gulp.dest('app/assets/img'))
        .pipe(notify({ message: 'Images task complete' }));
});
gulp.task('clean', function() {
    return del(['app/assets/css', 'app/assets/js', 'app/assets/img']);
});
gulp.task('watch', function() {
    // Watch .scss files
    gulp.watch('resources/sass/**/*.scss', ['styles']);

    // Watch .js files
    gulp.watch('resources/scripts/**/*.js', ['scripts']);

    // Watch image files
    gulp.watch('resources/images/**/*', ['images']);

    // Create LiveReload server
    //livereload.listen();

    // Watch any files in dist/, reload on change
    //gulp.watch(['app/**']).on('change', livereload.changed);
});