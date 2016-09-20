'use strict';

var gulp = require('gulp');

var stylus       = require('gulp-stylus');
var plumber      = require('gulp-plumber');
var notify       = require('gulp-notify');
var postcss      = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
// var reporter     = require('postcss-reporter');
// var syntax_scss  = require('postcss-scss');
var flexboxfixer = require('postcss-flexboxfixer');
var cssnano      = require('cssnano');
var mqpacker     = require('css-mqpacker');
// var stylelint    = require('stylelint');
var sourcemaps   = require('gulp-sourcemaps');
var newer        = require('gulp-newer');
var rename       = require('gulp-rename');
var gulpIf       = require('gulp-if');
var browserSync  = require('browser-sync').create();
var concat       = require('gulp-concat');
var uglify       = require('gulp-uglify');
var imagemin     = require('gulp-imagemin');
var pngquant     = require('imagemin-pngquant');
// var svgSprite    = require('gulp-svg-sprite');
var fs           = require('fs'); // встроенный в node модуль, устанавливать не надо
var foldero      = require('foldero'); // плагин
var pug          = require('gulp-pug');
var del          = require('del');
var ghPages      = require('gulp-gh-pages');
var dataPath     = 'src/pug/data'; // Где лежат файлы

var argv = require('minimist')(process.argv.slice(2));

var path = require('path');

var isOnProduction = !!argv.production;
var buildPath      = isOnProduction ? 'build' : 'tmp';
var srcPath        = 'src/';





/* ==============================
=            DEPLOY             =
============================== */

function deploy() {
  console.log('deploy function');
  return gulp.src('**/*', {cwd: buildPath})
    .pipe(ghPages());
}

/* =====  End of DEPLOY  ====== */





/* ============================
=            PUG             =
============================ */

gulp.task('pug', function() {
  // В этой переменной копим данные
  var siteData = {};

  // Проверяем, есть ли по заданному пути папка
  if (fs.existsSync(dataPath)) {

    // Берем и пишем в siteData
    siteData = foldero(dataPath, {
      recurse: true,
      whitelist: '(.*/)*.+\.(json)$', //... все json файлы
      // Так обрабатываем каждый файл:
      loader: function loadAsString(file) {
        var json = {}; // Сюда будем писать значения
        // Пробуем извлечь из файла json
        try {
          json = JSON.parse(fs.readFileSync(file, 'utf8'));
        }
        // Ругаемся, если в файле лежит плохой json
        catch (e) {
          console.log('Error Parsing JSON file: ' + file);
          console.log('==== Details Below ====');
          console.log(e);
        }
        // А если все ок, то добавляем его в siteData
        return json;
      }
    });
  }
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





/*=======================================
=              SVG-SPRITE               =
=======================================*/

// gulp.task('svg', function() {
//   return gulp.src('**/*.svg', {cwd: path.join(srcPath, 'img/svg-sprite')})
//   .pipe(svgSprite({
//     mode: {
//       symbol: {
//         dest: '.',
//         dimensions: '%s',
//         sprite: buildPath + '/img/svg-sprite.svg',
//         example: false,
//         render: {scss: {dest: 'src/sass/_global/svg-sprite.scss'}}
//       }
//     },
//     svg: {
//       xmlDeclaration: false,
//       doctypeDeclaration: false
//     }
//   }))
//   .pipe(gulp.dest('./'));
// });

/*========  End of SVG-SPRITE  ========*/





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





/* =================================
=            STYLETEST           =
================================= */

// gulp.task('styletest', function() {
//   var processors = [
//   stylelint(),
//   reporter({
//     throwError: true
//   })
//   ];
//   return gulp.src(['!src/sass/_global/svg-sprite.scss', 'src/sass/**/*.scss'])

//   .pipe(plumber({
//     errorHandler: notify.onError({
//       message: 'Error: <%= error.message %>',
//       sound: 'notwork'
//     })
//   }))
//   .pipe(postcss(processors, {syntax: syntax_scss}));
// });

/* =====  End of STYLETEST  ====== */





/*=================================
=            Gulp SASS            =
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

/*=====  End of Gulp SASS  ======*/





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




gulp.task('server', function(callback) {
  if (isOnProduction) {
    console.log('--- deploy ---');
    // deploy();
    callback();
  }
  if (!isOnProduction) {
    console.log('   ===============================================    ');
    console.log(' ====          Start server and watch           ====  ');
    console.log('   ===============================================    ');
    server();

    gulp.watch('**/*.styl', {cwd: path.join(srcPath, 'stylus')}, gulp.series('style'));
    gulp.watch('**/*.styl', {cwd: path.join(srcPath, 'modules')}, gulp.series('style'));
    gulp.watch('**/*.{pug,json}', {cwd: path.join(srcPath)}, gulp.series('pug', reloader));
    // gulp.watch('**/*.{pug}', {cwd: path.join(srcPath, 'modules')}, gulp.series('pug', reloader));
    gulp.watch('**/*.{jpg,jpeg,gif,png,svg}', {cwd: path.join(srcPath, 'img')}, gulp.series('img', reloader));
    gulp.watch('**/*.js', {cwd: path.join(srcPath, 'js')}, gulp.series('js', reloader));
    gulp.watch('**/*.js', {cwd: path.join(srcPath, 'modules')}, gulp.series('js', reloader));
    // gulp.watch('**/*.svg', {cwd: path.join(srcPath, 'img/svg-sprite')}, ['svg', browserSync.reload]);
    // gulp.watch(['**/*.*','!svg-sprite/**'], {cwd: path.join(srcPath, 'img')}, ['img', browserSync.reload]);
    // gulp.watch('**/*.*', {cwd: path.join(srcPath, 'fonts')}, ['fonts', browserSync.reload]);
  }
});


/* =====  End of Start watch  ====== */

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

gulp.task('default', gulp.series(
  'build',
  'server'
));


// Перезагрузка в браузере
function reloader(done) {
  browserSync.reload();
  done();
}
