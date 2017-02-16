const fs = require('fs')
const path = require('path')
const globby = require('globby')
const promiseSeries = require('promise.series')
const pify = require('pify')
const mkdir = pify(require('mkdirp'))

function readFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, content) => {
      if (err) {
        return reject(err)
      }
      resolve({path: file, content})
    })
  })
}

function writeFile(file, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, content, 'utf8', err => {
      if (err) {
        return reject(err)
      }
      resolve({path: file, content})
    })
  })
}

let plugins
let tasks

module.exports = class Task {
  constructor(inputTasks = tasks) {
    this.loadPlugins()
    this.pipes = []
    this.tasks = inputTasks
    tasks = inputTasks
  }

  loadPlugins() {
    if (plugins) {
      return this
    }
    plugins = fs.readdirSync('node_modules').filter(name => /^tasco-/.test(name))
    for (const name of plugins) {
      const plugin = require(path.resolve('node_modules', name))
      this.use(plugin)
    }
    return this
  }

  use({name, pipe}) {
    this[name] = (...args) => {
      this.pipe(function () {
        return pipe.call(this, ...args)
      })
      return this
    }
    return this
  }

  parallel(...args) {
    const tasks = Array.isArray(args[0]) ? args[0] : args
    return Promise.all(tasks.map(name => this.tasks[name](new Task())))
  }

  sequence(...args) {
    const tasks = Array.isArray(args[0]) ? args[0] : args
    return promiseSeries(tasks.map(name => () => this.tasks[name](new Task())))
  }

  single(name) {
    const task = this.tasks[name]
    if (task) {
      return task(new Task())
    }
  }

  input(...args) {
    const globs = Array.isArray(args[0]) ? args[0] : args
    this
      .pipe(() => {
        return globby(globs)
      })
      .pipe(paths => {
        return Promise.all(paths.map(path => readFile(path)))
      })
      .pipe(files => {
        this.files = files
      })
    return this
  }

  output(destDir) {
    if (!destDir) {
      return this
    }
    this.pipe(() => Promise.all(this.files.map(file => {
      const filename = path.basename(file.path)
      const dest = path.resolve(destDir, filename)
      return writeFile(dest, file.content)
    })))
    return mkdir(destDir).then(() => promiseSeries(this.pipes))
  }

  pipe(fn) {
    this.pipes.push(fn.bind(this))
    return this
  }
}
