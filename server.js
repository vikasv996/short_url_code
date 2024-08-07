const swaggerUi = require('swagger-ui-express')
const basicAuth = require('basic-auth')
const path = require('path')
const fs = require('fs')
const config = require('./configs/configs')
const express = require('./configs/express')
const mongoose = require('./configs/mongoose')
const Seed = require('./app/services/Seed')
const app = express(path.resolve(__dirname));

const auth = function (req, res, next) {
  const user = basicAuth(req)
  if (!user || !user.name || !user.pass) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
    res.sendStatus(401)
    return
  }
  if (user.name === config.HTTPAuthUser && user.pass === config.HTTPAuthPassword) {
    next()
  } else {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
    return res.sendStatus(401)
  }
}

// global.appRoot = path.resolve(__dirname)

db = mongoose()

// app.get("*", function (request, response) {
//   response.sendFile(path.resolve(__dirname, "./client/build", "index.html"));
// });

app.get('/', function (req, res, next) {
  res.send(`<h1>URL Shortener</h1>`)
})

app.get('/health-check', (req, res) => {
  res.status(200).send("All Good");
})

// Later moved this code snippet to dev
const options = {
  customCss: '.swagger-ui .models { display: none }',
  customSiteTitle: 'URL Shortener: ' + process.env.NODE_ENV,
  swaggerOptions: {
    docExpansion: 'none',
    tagsSorter: 'alpha'
  }
}
const mainSwaggerData = JSON.parse(fs.readFileSync('swagger.json'))
mainSwaggerData.host = config.host
mainSwaggerData.basePath = config.baseApiUrl

const modules = './app/modules'
fs.readdirSync(modules).forEach(file => {
  if (fs.existsSync(modules + '/' + file + '/swagger.json')) {
    const stats = fs.statSync(modules + '/' + file + '/swagger.json')
    const fileSizeInBytes = stats.size
    if (fileSizeInBytes) {
      let swaggerData = fs.readFileSync(modules + '/' + file + '/swagger.json')
      swaggerData = swaggerData ? JSON.parse(swaggerData) : { paths: {}, definitions: {} }
      mainSwaggerData.paths = { ...swaggerData.paths, ...mainSwaggerData.paths }
      mainSwaggerData.definitions = { ...swaggerData.definitions, ...mainSwaggerData.definitions }
    }
  }
})

if (config.isHTTPAuthForSwagger && config.isHTTPAuthForSwagger === 'true') {
  app.get('/docs', auth, (req, res, next) => {
    next()
  })
}
app.use('/docs', swaggerUi.serve, swaggerUi.setup(mainSwaggerData, options))

new Seed().seedData()

// Listening Server
const port = process.env.PORT || config.port;
app.listen(parseInt(port), async () => {
  console.log('process.env.NODE_ENV', process.env.NODE_ENV)
  console.log(`Server running at http://localhost:${port}`)
})
