var gulp = require('gulp');
var tsc = require('gulp-typescript');
var less = require('gulp-less');
var cache = require('gulp-cached');
var del = require('del');

gulp.task('default', ['process-html', 'process-css', 'process-js']);

gulp.task('clean', function() {
    cache.caches = {};
    return del([
        'build/'
    ]);
});

gulp.task('process-js', function() {
    return gulp.src('src/ts/client/client.ts')
        .pipe(tsc({
            out: 'gerp-squirrel.js'
        })).js
        .pipe(gulp.dest('build/js/'));
});

gulp.task('process-html', function() {
    return gulp.src('src/html/index.html')
        .pipe(cache('html'))
        .pipe(gulp.dest('build'));
});

gulp.task('process-css', function() {
    return gulp.src('src/css/**/*.less')
        .pipe(less({
            paths: ['src/css/']
        }))
        .pipe(gulp.dest('build/css/main.css'));
});

gulp.task('watch', function() {
    return gulp.watch('src/ts/**/*.ts', ['process-js'])
});