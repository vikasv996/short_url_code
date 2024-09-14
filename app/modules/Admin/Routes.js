module.exports = (app, express) => {
  const router = express.Router()
  const Controller = require('./Controller')
  const Validator = require('./Validator')
  const config = require('../../../configs/configs')

  router.post('/register', Validator.registerValidator(), Validator.validate, (req, res, next) => {
    const obj = new Controller().boot(req, res)
    return obj.register()
  })

  router.post('/login', Validator.registerValidator(), Validator.validate, (req, res, next) => {
    const obj = new Controller().boot(req, res)
    return obj.login()
  })

  router.post('/logout', Validator.validate, (req, res, next) => {
    const obj = new Controller().boot(req, res)
    return obj.logout()
  })

  app.use(config.baseApiUrl, router)
}
