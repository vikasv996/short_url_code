const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const fs = require('fs')
const { glob } = require('glob')
const path = require('path')

module.exports = function (appRoot) {
  console.log('env - ' + process.env.NODE_ENV)
  const app = express()

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
  }

  app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
  }))

  app.use(bodyParser.json())

  app.use(cors())
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })

  app.use(express.json())

  const modules = '/app/modules';
  glob(path.join(appRoot, modules) + '/**/*Routes.js', {})
    .then(files => {
        files.forEach((route) => {
            route = path.join(appRoot, route);
            const stats = fs.statSync(route)
            const fileSizeInBytes = stats.size
            if (fileSizeInBytes) {
              require(route)(app, express)
            }
          })
    })
    .catch(err => {
        console.log("error");
        console.log(err);
    })
  
  return app;
}
