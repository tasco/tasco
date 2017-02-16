import * as babel from 'babel-core'
// The default task
export default async function (t) {
  await t.parallel('js', 'css')
}

// Transform css using PostCSS
// Using postcss-cssnext
export async function css(t) {
  await t
    .input('./example/*.css')
    .pipe(function () {
      this.files.forEach((file, index) => {
        this.files[index].content += 'lol'
      })
    })
    .output('./dist/css/')
}

// Transform js using Babel
// Using babel-preset-es2015
export async function js(t) {
  t.use({
    name: 'babel',
    pipe(options) {
      this.files.forEach((file, index) => {
        this.files[index].content = babel.transform(this.files[index].content, options).code
      })
    }
  })

  await t.input('example/*.js')
    .babel({
      presets: ['latest']
    })
    .output('dist/js/')
}
