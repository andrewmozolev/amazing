'use strict';

var gulp = require('gulp');

var stylus       = require('gulp-stylus');
var plumber      = require('gulp-plumber');
var notify       = require('gulp-notify');
var postcss      = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var flexboxfixer = require('postcss-flexboxfixer');
var cssnano      = require('cssnano');
var mqpacker     = require('css-mqpacker');
var sourcemaps   = require('gulp-sourcemaps');
var newer        = require('gulp-newer');
var rename       = require('gulp-rename');
var gulpIf       = require('gulp-if');
var browserSync  = require('browser-sync').create();
var concat       = require('gulp-concat');
var uglify       = require('gulp-uglify');
var imagemin     = require('gulp-imagemin');
var pngquant     = require('imagemin-pngquant');
var fs           = require('fs'); // встроенный в node модуль, устанавливать не надо
var foldero      = require('foldero'); // плагин
var pug          = require('gulp-pug');
var del          = require('del');
var ghPages      = require('gulp-gh-pages');

var argv = require('minimist')(process.argv.slice(2));

var path = require('path');

var isOnProduction = !!argv.production;
var buildPath      = isOnProduction ? 'build' : 'tmp';
var srcPath        = 'src/';




/* ==============================
=            DEPLOY             =
============================== */


gulp.task('deploy', function(callback) {
  if (isOnProduction) {
    return gulp.src('**/*', {cwd: buildPath})
      .pipe(ghPages());
  }
  callback();
});

/* =====  End of DEPLOY  ====== */





/* ============================
=            PUG             =
============================ */

gulp.task('pug', function() {
  console.log('   ===============================================   ');
  console.log(' ====      Assembly .html files from .pug       ====  ');
  console.log('   ===============================================   ');

  // Только тут начался галп
  return gulp.src('**/*.pug', {cwd: path.join(srcPath, 'pug/pages')})
    .pipe(plumber({
      errorHandler: notify.onError({
        message: 'Error: <%= error.message %>',
        sound: 'notwork'
      })
    }))
    .pipe(pug({
      pretty: true
    }))
    .pipe(gulp.dest(buildPath))
    .pipe(notify({
      message: 'Pug complite: <%= file.relative %> !',
      sound: 'Pop'
    }));
});

/* =====  End of PUG  ====== */





/*===================================
=            Gulp IMAGES            =
===================================*/

gulp.task('img', function() {
  console.log('   ===============================================    ');
  console.log(' ====        Copy and optimization images       ====  ');
  console.log('   ===============================================    ');
  return gulp.src(['!svg-sprite/*.*', '**/*.*'], {cwd: path.join(srcPath, 'img')})
    .pipe(newer(path.join(buildPath, '/img')))  // оставить в потоке только изменившиеся файлы
    .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()]
    }))
    .pipe(gulp.dest(path.join(buildPath, '/img')));
});

/*=====  End of Gulp IMAGES  ======*/





/*===============================
=               JS              =
===============================*/

gulp.task('js', function() {
  console.log('   ===============================================    ');
  console.log(' ====          Concat and min .js files         ====  ');
  console.log('   ===============================================    ');
  return gulp.src(['modules/**/*.js','js/**/*.js'], {cwd: srcPath})
  .pipe(plumber({
    errorHandler: notify.onError('Error: <%= error.message %>')
  }))
  .pipe(gulpIf(!isOnProduction, sourcemaps.init()))
  .pipe(concat('scripts.js'))
  .pipe(gulpIf(!isOnProduction, gulp.dest(path.join(buildPath, 'js'))))
  .pipe(uglify())
  .pipe(rename('scripts.min.js'))
  .pipe(gulpIf(!isOnProduction, sourcemaps.write('./')))
  .pipe(gulp.dest(path.join(buildPath, 'js')))
  .pipe(notify({
    message:'JS complite: <%= file.relative %>!',
    sound: 'Pop'
  }));
});

/*=======  End of JS  ========*/





/*=================================
=            Gulp Style            =
=================================*/

gulp.task('style', function() {
  return gulp.src('style.styl', {cwd: path.join(srcPath, 'stylus')})
  .pipe(plumber({
    errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      sound: 'notwork'
    })
  }))
  .pipe(gulpIf(!isOnProduction, sourcemaps.init()))
  .pipe(stylus())
  .pipe(postcss([
    flexboxfixer,
    autoprefixer({browsers: ['last 2 version']}),
    mqpacker,
    cssnano({safe:true})
    ]))
  .pipe(rename('style.min.css'))
  .pipe(gulpIf(!isOnProduction, sourcemaps.write('./')))
  .pipe(gulp.dest(path.join(buildPath, '/css')))
  .pipe(browserSync.stream({match: '**/*.css'}))
  .pipe(notify({
    message:'SCSS complite: <%= file.relative %>!',
    sound: 'Pop'
  }));
});

/*=====  End of Gulp Style  ======*/





/* ==================================
=            Gulp FONTS            =
================================== */

gulp.task('fonts', function() {
  console.log('   ===============================================    ');
  console.log(' ====                 Copy fonts                ====  ');
  console.log('   ===============================================    ');
  return gulp.src('**/*.*', {cwd: path.join(srcPath, 'fonts')})
  .pipe(gulp.dest(buildPath + '/fonts'));
});

/* =====  End of Gulp FONTS  ====== */





/* ===========================
=            CLEAN            =
=========================== */

gulp.task('clean', function() {
  return del([path.join(buildPath), path.join(srcPath, 'sass/svg-sprite.scss')]).then(paths => {
    console.log('Deleted files and folders:\n', paths.join('\n'));
  });
});

/* =====  End of CLEAN  ====== */





/* ==================================
=              SERVER               =
================================== */
  gulp.task('server', function() {
    browserSync.init({
      server: {
        baseDir: buildPath
      },
      notify: false,
      open: false,
      port: 3000,
      ui: false
    });
  });
/* =====  End of SERVER  ====== */





/* =============================
=            BUILD             =
============================= */

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('img', 'style','fonts','js'),
  'pug'
));
/* =====  End of BUILD  ====== */





/* ==============================
=            SERVER             =
============================== */

gulp.task('server', function(callback) {
  if (!isOnProduction) {
    console.log('   ===============================================    ');
    console.log(' ====          Start server and watch           ====  ');
    console.log('   ===============================================    ');
    server();

    gulp.watch('**/*.styl', {cwd: path.join(srcPath, 'stylus')}, gulp.series('style'));
    gulp.watch('**/*.styl', {cwd: path.join(srcPath, 'modules')}, gulp.series('style'));
    gulp.watch('**/*.{pug,json}', {cwd: path.join(srcPath)}, gulp.series('pug', reloader));
    gulp.watch('**/*.{jpg,jpeg,gif,png,svg}', {cwd: path.join(srcPath, 'img')}, gulp.series('img', reloader));
    gulp.watch('**/*.js', {cwd: path.join(srcPath, 'modules')}, gulp.series('js', reloader));
  }
  callback();
});

function server() {
  browserSync.init({
    server: {
      baseDir: buildPath
    },
    notify: false,
    open: false,
    port: 3000,
    ui: false
  });
}

/* =====  End of SERVER  ====== */





/* ===============================
=            DEFAULT             =
=============================== */

gulp.task('default', gulp.series(
  'build',
  'deploy',
  'server'
));

/* =====  End of DEFAULT  ====== */



// Перезагрузка в браузере
function reloader(done) {
  browserSync.reload();
  done();
}
