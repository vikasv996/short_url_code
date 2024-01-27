module.exports = (app, express) => {

  const router = express.Router();
  const Controller = require('./Controller');
  // const Validator = require('./Validator');
  const config = require('../../../configs/configs');
  const Globals = require("../../services/Globals");

  router.post('/insert-url', Globals.isAuthorised, (req, res, next) => {
    const obj = new Controller().boot(req, res);
    return obj.addUrlShortener();
  });

  router.get('/list-url', Globals.isAuthorised, (req, res, next) => {
    const obj = new Controller().boot(req, res);
    return obj.listUrls();
  });

  router.delete('/:customUrl', Globals.isAuthorised, (req, res, next) => {
    const obj = new Controller().boot(req, res);
    return obj.deleteUrl();
  })

  router.get('/red/:customUrl', (req, res, next) => {
      const obj = new Controller().boot(req, res);
      return obj.redirectUrl();
  });
  app.use(router);
}