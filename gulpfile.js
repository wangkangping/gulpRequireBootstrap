var gulp = require('gulp'),
    sass = require('gulp-sass'),
    plumber = require('gulp-plumber'),
    notify = require('gulp-notify'),
    renameMd5 = require('gulp-rename-md5'),
    eos = require('end-of-stream'),
    clean = require('gulp-clean'),
    replace = require('gulp-replace'),
    mergestream = require('merge-stream'),
    requirejsOptimize = require('gulp-requirejs-optimize'),
    collector = require('gulp-rev-collector'),
    rev = require('gulp-rev'),
    runSequence = require('run-sequence'),
    browser = require('browser-sync').create(),
    fs = require('fs');

/**
 * deal with css files
 */
gulp.task('distStyleSheet', function() {

    return gulp.src('src/stylesheets/**/*')
        .pipe(sass({
            outputStyle: 'nested',

            precison: 3,

            errLogToConsole: true,

            includePaths: ['bower_components/bootstrap-sass/assets/stylesheets']
        }).on('error', sass.logError))
        // plus md5 as js filename
        // Test env
        // TODO
        // .pipe(rev())
        .pipe(gulp.dest('dist/stylesheets'))
        // create json file which includes the maps
        // Do not use {merge: true}, since gulp-rev need us to provide more details, such base option 
        .pipe(rev.manifest('dist/rev-manifest.json', { base: process.cwd() + '/dist', merge: true })) //生成转换列表的json文件
        .pipe(gulp.dest("./dist"));

});

/**
 * deal with scripts
 */
gulp.task('distScripts', ['bowerTest'], function() {

    return gulp.src('src/scripts/**/*')
        // concat all files into one file,
        // to save the HTTP request
        // do not include jquery into service file
        .pipe(requirejsOptimize({
            // Do not need compress code in local env
            // TODO
            optimize: "none",
            // config file of requireJS
            mainConfigFile: 'src/scripts/vendor/config.js',
            // analysis the nested require method
            //findNestedDependencies: true,
            paths: {
                // all files path is base on the origin one. So empty
                "PDAppDir": "",
                // ignore jqueryjs
                "jquery": "empty:"
            }
        }))
        // plus md5 as js filename
        // Test env
        // TODO
        // .pipe(rev())
        .pipe(gulp.dest('dist/scripts'))
        // create json file which includes the diffs
        // Do not use {merge: true}, since gulp-rev need us to provide more details, such base option 
        .pipe(rev.manifest('dist/rev-manifest.json', { base: process.cwd() + '/dist', merge: true })) //生成转换列表的json文件
        .pipe(gulp.dest("./dist"));

});

/**
 * deal with views
 */
gulp.task('distViews', ['distScripts', 'distStyleSheet'], function() {

    // Test env
    // TODO
    // var version = common.getMd5Version();

    return gulp.src([
            // 'dist/*.json', TODO
            'src/views/**/*'
        ])
        //replace the file name(css and js) with md5
        // Test env
        // TODO
        // .pipe(collector())
        // replace links for local evn
        // replacement need to change if the env changes
        // TODO
        .pipe(replace('href="/', 'href="../../'))
        .pipe(replace('src="/', 'src="../../'))
        .pipe(replace('data-main="/', 'data-main="../../'))
        // Test env
        // TODO
        // .pipe(replace('/config', '/config-' + version))
        .pipe(gulp.dest('dist/views'));
});

/**
 * default
 */
gulp.task('default', function() {

    // deal with sycn 
    // Each argument to run-sequence is run in order
    runSequence('cleanLocal', 'distViews', 'watchFiles');


    gulp.watch(['src/scripts/**/*'], ['distScripts']);
    gulp.watch(['src/views/**/*'], ['distViews']);
    gulp.watch(['src/stylesheets/**/*'], ['distStyleSheet']);


});

/**
 * copy requirejs and jqueryjs into dist foler
 * all common js need to add here
 */
gulp.task('bowerTest', function() {

    var stream1 =
        gulp.src('bower_components/requirejs/require.js')
        // .pipe(gulp.dest('src/scripts/vendor'))
        // .pipe(renameMd5())
        // .pipe(uglify())
        .pipe(gulp.dest('dist/scripts/vendor'));
    var stream2 =
        gulp.src('bower_components/jquery/dist/jquery.js')
        // .pipe(gulp.dest('src/scripts/vendor'))
        // .pipe(renameMd5())
        .pipe(gulp.dest('dist/scripts/vendor'));

    return mergestream(stream1, stream2);
});

/**
 * watch
 */
gulp.task('watchFiles', function() {

    browser.init({
        files: [
            'src/scripts/**/*',
            'src/views/**/*',
            'src/stylesheets/**/*'
        ],
        logLever: 'debug',
        logPrefix: 'insgeek',
        server: {
            baseDir: 'dist/',
            index: 'views/signin/signin.html'
        },
        ghostMode: {
            clicks: true,
            forms: true,
            scroll: true
        },
        browser: "chrome"
    });
});

/*
 * clean dist dir
 */
gulp.task('cleanLocal', function() {
    return gulp.src(['dist'], { read: false })
        .pipe(clean());
});

var common = {

    /**
     * get md5 version for config.js
     * since gulp-rev-collector couldn't update md5 file name for config.js
     * I am shame of the inelegant code.
     */
    getMd5Version: function() {
        var string = fs.readFileSync('dist/rev-manifest.json').toString(),
            index1 = string.indexOf('config-'),
            // config- length
            len = 7;

        string = string.substring(index1);
        string = string.substring(7, string.indexOf('.js'));

        return string;

    }
};