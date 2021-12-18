const projectFolder = 'build';
const sourceFolder = '#source';

const path = {
  build: {
    html: `${projectFolder}/`,
    css: `${projectFolder}/css/`,
    js: `${projectFolder}/js/`,
    img: `${projectFolder}/img/`,
    svg: `${projectFolder}/img/icons/`,
    fonts: `${projectFolder}/fonts/`
  },
  src: {
    html: [`${sourceFolder}/*.html`, `!${sourceFolder}/_*.html`],
    css: `${sourceFolder}/scss/style.scss`,
    js: `${sourceFolder}/js/script.js`,
    vendorJs: `${sourceFolder}/js/vendor/*.js`,
    img: `${sourceFolder}/img/`, // 'source/img/**/*.{png,jpg,svg}'
    svg: `${sourceFolder}/img/icons/*.svg`,
    fonts: `${sourceFolder}/fonts/*.*`
  },
  watch: {
    html: `${sourceFolder}/**/*.html`,
    css: `${sourceFolder}/scss/**/*.scss`,
    js: `${sourceFolder}/js/**/*.js`,
    img: `${sourceFolder}/img/`,
    svg: `${sourceFolder}/img/icons/*.svg`
  },
  clean: `./${projectFolder}/`
};

import gulp from 'gulp';
import plumber from 'gulp-plumber';
import sourcemap from 'gulp-sourcemaps';
import sass from 'gulp-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import browserSync from 'browser-sync';
import csso from 'gulp-csso';
import rename from 'gulp-rename';
import imagemin from 'gulp-imagemin';
import webp from 'gulp-webp';
import svgstore from 'gulp-svgstore';
import concat from 'gulp-concat';
import del from 'del';
import fileInclude from 'gulp-file-include';
import webphtml from 'gulp-webp-html';
import terser from 'gulp-terser';

export const css = () => {
  return gulp.src(path.src.css)
      .pipe(plumber())
      .pipe(sourcemap.init())
      .pipe(sass())
      .pipe(postcss([autoprefixer()]))
      .pipe(gulp.dest(path.build.css))
      .pipe(csso())
      .pipe(rename('style.min.css'))
      .pipe(sourcemap.write('.'))
      .pipe(gulp.dest(path.build.css));
};

export const server = () => {
  browserSync.init({
    server: {
      baseDir: projectFolder
    },
    cors: true,
    notify: false,
    ui: false,
  });
};

export const refresh = (done) => {
  browserSync.reload();
  done();
};

export const images = () => {
  return gulp.src(path.src.img)
      .pipe(imagemin([
        imagemin.optipng({optimizationLevel: 3}),
        imagemin.mozjpeg({quality: 90, progressive: true}),
        imagemin.gifsicle({interlaced: true}),
        imagemin.svgo({
          plugins: [
            {removeViewBox: false},
            {cleanupIDs: false}
          ]
        })
      ]))
      .pipe(gulp.dest(path.src.img))
      .pipe(browserSync.stream());
};

export const webP = () => {
  return gulp.src(path.src.img)
      .pipe(webp({quality: 90}))
      .pipe(gulp.dest(path.src.img));
};

export const sprite = () => {
  return gulp.src(path.src.svg)
      .pipe(gulp.dest(path.build.svg))
      .pipe(svgstore({inlineSvg: true}))
      .pipe(rename('sprite.svg'))
      .pipe(gulp.dest(path.build.svg));
};

export const html = () => {
  return gulp.src(path.src.html)
      .pipe(fileInclude())
      .pipe(webphtml())
      .pipe(gulp.dest(path.build.html));
};

export const scripts = () => {
  return gulp.src(path.src.js)
      .pipe(concat('main.js'))
      .pipe(gulp.dest(path.build.js))
      .pipe(rename({
        extname: '.min.js'
      }))
      .pipe(terser())
      .pipe(gulp.dest(path.build.js));
};

export const vendorScripts = () => {
  return gulp.src(path.src.vendorJs)
      .pipe(concat('vendor.js'))
      .pipe(gulp.dest(path.build.js))
      .pipe(terser())
      .pipe(rename({
        extname: '.min.js'
      }))
      .pipe(gulp.dest(path.build.js));
};

export const watcher = () => {
  gulp.watch([path.src.css], gulp.series('css', 'refresh'));
  gulp.watch([path.src.svg], gulp.series('sprite', 'refresh'));
  gulp.watch([path.src.html], gulp.series('html', 'refresh'));
  gulp.watch([path.src.js], gulp.series('scripts', 'refresh'));
  gulp.watch([path.src.img], gulp.series('images', 'refresh'));
};

export const copy = () => {
  return gulp.src([
    `${path.src.fonts}/*.{woff,woff2}`,
    `${path.src.img}`,
  ], {
    base: sourceFolder
  })
      .pipe(gulp.dest(projectFolder));
};

export const clean = () => {
  return del(projectFolder);
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
    watcher
);
