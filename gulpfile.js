/* eslint-disable camelcase */
/* eslint-disable consistent-return */
const prjFolder = 'build';
const srcFolder = '#source';

const fs = require('fs');

const {src, dest, watch, series, parallel} = require('gulp');
const plumber = require('gulp-plumber');
const sourcemap = require('gulp-sourcemaps');
const browsersync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');
const del = require('del');
const scss = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const groupMedia = require('gulp-group-css-media-queries');
const cleanCss = require('gulp-clean-css');
const rename = require('gulp-rename');
const terser = require('gulp-terser');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const webphtml = require('gulp-webp-html');
const webpcss = require('gulp-webpcss');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const svgstore = require('gulp-svgstore');
const concat = require('gulp-concat');

const path = {
  build: {
    html: `${prjFolder}/`,
    css: `${prjFolder}/css/`,
    vendor: `${prjFolder}/css/vendor/`,
    js: `${prjFolder}/js/`,
    img: `${prjFolder}/img/`,
    fonts: `${prjFolder}/fonts/`,
  },
  src: {
    html: [`${srcFolder}/*.html`, `!${srcFolder}/_*.html`],
    css: `${srcFolder}/scss/**/style.scss`,
    vendor: [`${srcFolder}/scss/vendor/*.scss`],
    js: `${srcFolder}/js/**/script.js`,
    img: `${srcFolder}/img/**`,
    fonts: `${srcFolder}/fonts/**/*.{woff,woff2}`
  },
  watch: {
    html: `${srcFolder}/**/*.html`,
    css: `${srcFolder}/scss/**/*.scss`,
    js: `${srcFolder}/js/**/*.js`,
    img: `${srcFolder}/img/**`
  },
  clean: `./${prjFolder}/`
};

function webServer() {
  browsersync.init({
    server: {
      baseDir: `./${prjFolder}/`
    },
    port: 3000,
    notify: false,
  });
}

function html() {
  return src(path.src.html)
      .pipe(fileinclude())
      .pipe(webphtml())
      .pipe(dest(path.build.html))
      .pipe(browsersync.stream());
}

function css() {
  return src(path.src.css)
      .pipe(plumber())
      .pipe(sourcemap.init())
      .pipe(
          scss({
            outputStyle: 'expanded'
          })
              .on('error', scss.logError)
      )
      .pipe(groupMedia())
      .pipe(
          autoprefixer({
            overrideBrowserslist: ['last 2 versions'],
            cascade: true
          })
      )
      .pipe(webpcss({
        webpClass: '.webp',
        noWebpClass: '.no-webp'
      }))
      .pipe(dest(path.build.css))
      .pipe(cleanCss())
      .pipe(
          rename({
            extname: '.min.css'
          })
      )
      .pipe(sourcemap.write('.'))
      .pipe(dest(path.build.css))
      .pipe(browsersync.stream());
}

function vendorCss() {
  return src(path.src.vendor)
      .pipe(plumber())
      .pipe(
        scss({
          outputStyle: 'expanded'
        })
            .on('error', scss.logError)
      )
      .pipe(dest(path.build.vendor))
      .pipe(cleanCss())
      .pipe(
          rename({
            extname: '.min.css'
          })
      )
      .pipe(dest(path.build.vendor))
}

function js() {
  return src(path.src.js)
      .pipe(plumber())
      .pipe(sourcemap.init())
      .pipe(concat('main.js'))
      .pipe(dest(path.build.js))
      .pipe(terser())
      .pipe(
          rename({
            extname: '.min.js'
          })
      )
      .pipe(sourcemap.write())
      .pipe(dest(path.build.js))
      .pipe(browsersync.stream());
}

function images() {
  return src(path.src.img)
      .pipe(
          imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            interlaced: true,
            optimizationLevel: 3
          }))
      .pipe(dest(path.build.img))
      .pipe(browsersync.stream());
}

function webP() {
  return src(path.src.img)
      .pipe(
          webp({
            quality: 90
          })
      )
      .pipe(dest(path.build.img))
      .pipe(browsersync.stream());
}

function sprite() {
  return src([`${path.src.img}/icons/*.svg`])
      .pipe(svgstore({
        inlineSvg: true
      }))
      .pipe(rename('sprite.svg'))
      .pipe(dest(`${path.build.img}/icons/`))
      .pipe(browsersync.stream());
}

function fonts() {
  src(path.src.fonts)
      .pipe(ttf2woff())
      .pipe(dest(path.build.fonts));
  return src(path.src.fonts)
      .pipe(dest(path.build.fonts))
      .pipe(ttf2woff2())
      .pipe(dest(path.build.fonts))
      .pipe(browsersync.stream());
}

function fontsStyle(params) {
  let file_content = fs.readFileSync(`${srcFolder}/scss/fonts.scss`);
  if (file_content == '') {
    fs.writeFile(`${srcFolder}/scss/fonts.scss`, '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split('.');
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(`${srcFolder}/scss/fonts.scss`, `@include font('${fontname}', '${fontname}', '400', 'normal');\r\n`, cb);
          }
          c_fontname = fontname;
        }
      }
    })
  }
}

function cb() {}

function watcher() {
  watch([path.watch.html], html);
  watch([path.watch.css], css);
  watch([path.watch.img], sprite);
  watch([path.watch.js], js);
}

function clean() {
  return del(path.clean);
}

const build = series(
    clean,
    html,
    fonts,
    css,
    vendorCss,
    images,
    webP,
    sprite,
    js,
    fontsStyle
);

const start = parallel(
    build,
    webServer,
    watcher
);

exports.vendorCss = vendorCss;
exports.webP = webP;
exports.clean = clean;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.sprite = sprite;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.start = start;
exports.default = start;
