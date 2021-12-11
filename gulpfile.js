import gulp from 'gulp';
import plumber from 'gulp-plumber';
import sourcemap from 'gulp-sourcemaps';
import sass from 'gulp-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import sync from 'browser-sync';
import csso from 'gulp-csso';
import rename from 'gulp-rename';
import imagemin from 'gulp-imagemin';
import webp from 'gulp-webp';
import svgstore from 'gulp-svgstore';
import posthtml from 'gulp-posthtml';
import include from 'posthtml-include';
import concat from 'gulp-concat';
import del from 'del';

export const css = () => {
  return gulp.src('source/sass/style.scss')
      .pipe(plumber())
      .pipe(sourcemap.init())
      .pipe(sass())
      .pipe(postcss([autoprefixer()]))
      .pipe(csso())
      .pipe(rename('style.min.css'))
      .pipe(sourcemap.write('.'))
      .pipe(gulp.dest('build/css'))
      .pipe(sync.stream());
};

export const server = () => {
  sync.init({
    server: 'build/',
    port: 3000,
    notify: false,
    open: true,
    cors: true,
    ui: false,
  });
};

export const refresh = (done) => {
  sync.reload();
  done();
};

export const images = () => {
  return gulp.src('source/img/**/*.{png,jpg,jpeg,svg}')
      .pipe(imagemin([
        imagemin.optipng({optimizationLevel: 3}),
        imagemin.jpegtran({progressive: true}),
        imagemin.svgo()
      ]))
      .pipe(gulp.dest('source/img'));
};

export const webP = () => {
  return gulp.src('source/img/**/*.{png,jpg,jpeg}')
      .pipe(webp({quality: 90}))
      .pipe(gulp.dest('source/img'));
};

export const sprite = () => {
  return gulp.src('source/img/{icon-*,logo*,htmlacademy*}.svg')
      .pipe(svgstore({inlineSvg: true}))
      .pipe(rename('sprite_auto.svg'))
      .pipe(gulp.dest('build/img'));
};

export const html = () => {
  return gulp.src('source/*.html')
      .pipe(posthtml([
        include()
      ]))
      .pipe(gulp.dest('build'));
};

export const scripts = () => {
  return gulp.src('source/js/*.js')
      .pipe(concat('main.js'))
      .pipe(gulp.dest('build/js'));
};

export const vendorScripts = () => {
  return gulp.src('source/js/vendor/swiper-bundle.js')
      .pipe(concat('vendor.js'))
      .pipe(gulp.dest('build/js'));
};

export const watch = () => {
  gulp.watch('source/sass/**/*.{scss,sass}', gulp.series('css'));
  gulp.watch('source/sass/**/*.{scss,sass}', gulp.series('css'));
  gulp.watch('source/img/icon-*.svg', gulp.series('sprite', 'refresh'));
  gulp.watch('source/*.html', gulp.series('html', 'refresh'));
  gulp.watch('source/js/*.js', gulp.series('scripts', 'refresh'));
};

export const copy = () => {
  return gulp.src([
    'source/fonts/**/*.{woff,woff2}',
    'source/img/**',
    'source//*.ico'
  ], {
    base: 'source'
  })
      .pipe(gulp.dest('build'));
};

export const clean = () => {
  return del('build');
};

export const build = gulp.series(
    clean,
    copy,
    gulp.parallel(
        css,
        images,
        sprite,
        html,
        scripts,
        vendorScripts
    )
);

export const start = gulp.series(
    build,
    server,
    watch
);
