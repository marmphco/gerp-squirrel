var gulp = require('gulp');
var tsc = require('gulp-typescript');
var del = require('del');
var merge = require('merge2');

gulp.task('default', ['client']);

gulp.task('clean', ['client-clean', 'gerp-squirrel-clean']);

generateTasksForClient('client');

// Task Generators

function generateTasksForClient(clientName) {

    var clientBuild = clientName + '-ts';
    var clientHTML = clientName + '-html';
    var clientCSS = clientName + '-css';
    var clientClean = clientName + '-clean';

    var projectDir = 'projects/'+ clientName;

    gulp.task(clientName, [clientBuild, clientHTML, clientCSS], function() {
        return gulp.src('projects/engine/build/js/gerp-squirrel.js')
            .pipe(gulp.dest(projectDir + '/build/js/'));
    });

    gulp.task(clientClean, function() {
        return del([
            projectDir + '/build/'
        ]);
    });

    gulp.task(clientBuild, ['gerp-squirrel'], function() {
        return tsc.createProject(projectDir + '/ts/tsconfig.json').src()
            .pipe(tsc({
                out: clientName + '.js'
            })).js
            .pipe(gulp.dest(projectDir + '/build/js/'));
    });

    gulp.task(clientHTML, function() {
        return gulp.src(projectDir + '/html/index.html')
            .pipe(gulp.dest(projectDir + '/build/'));
    });

    gulp.task(clientCSS, function() {
        return gulp.src(projectDir + '/css/**/*.css')
            .pipe(gulp.dest(projectDir + '/build/css/'));
    });
}

// Engine

gulp.task('gerp-squirrel', ['gerp-squirrel-ts']);

gulp.task('gerp-squirrel-clean', function() {
    return del([
        'projects/engine/build/'
    ]);
});

gulp.task('gerp-squirrel-ts', function() {
    var result = tsc.createProject('projects/engine/ts/tsconfig.json')
        .src()
        .pipe(tsc({
            declaration: true,
            out: 'gerp-squirrel.js'
        }));

    return merge([
            result.js.pipe(gulp.dest('projects/engine/build/js')),
            result.dts.pipe(gulp.dest('projects/engine/build/dts'))
        ]);
});
