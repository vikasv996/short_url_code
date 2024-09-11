const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const fs = require('fs')
const { glob } = require('glob')
const path = require('path')

module.exports = function (appRoot) {
  console.log('env - ' + process.env.NODE_ENV)
  const app = express()

  app.disable('x-powered-by');
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
  }

  app.use(express.urlencoded({
    limit: '50mb',
    extended: true
  }))

  app.use(express.json())

  app.use(cors())
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })

  // app.use(express.json())
  // app.use(express.static(path.resolve(__dirname, '../client/build')));

  const modules = '/app/modules';
  // console.log("appRoot", appRoot);
  // console.log("modules", modules);
  // console.log("path.join(appRoot, modules)", path.join(appRoot, modules));
  glob(path.join(appRoot, modules) + '/**/*Routes.js', {})
    .then(files => {
      // console.log("files");
      // console.log(files);
        files.forEach((route) => {
            // route = path.join(appRoot, route);
            const stats = fs.statSync(route)
            const fileSizeInBytes = stats.size
            if (fileSizeInBytes) {
              require(route)(app, express)
            }
          })
    })
    .catch(err => {
        console.log("Glob error::");
        console.log(err);
    })
  
  return app;
}
