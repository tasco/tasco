import * as babel from 'babel-core'
/*
  Default task

  Ever wanted to add help info to task?
  You can!
  run {{ chalk.yellow('`tasco help`') }} to list all task helps
  run {{ chalk.yellow('`tasco help <taskName>`') }} to list full help for specific task
*/
export default async function (t) {
  console.log('started!')
  await t.parallel('js')
}

// Build js files
// Using babel
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
