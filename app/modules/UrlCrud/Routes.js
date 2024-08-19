module.exports = (app, express) => {

  const router = express.Router();
  const Controller = require('./Controller');
  const { insertUrlSchemaValidator, deleteUrlSchemaValidator, updateUrlSchemaValidator } = require('../../services/Validators');
  const config = require('../../../configs/configs');
  const Globals = require("../../services/Globals");

  router.post('/insert-url', Globals.isAuthorised, insertUrlSchemaValidator, (req, res, next) => {
    const obj = new Controller().boot(req, res);
    return obj.addUrlShortener();
  });

  router.get('/list-url', Globals.isAuthorised, (req, res, next) => {
    const obj = new Controller().boot(req, res);
    return obj.listUrls();
  });

  router.put('/update-url', Globals.isAuthorised, updateUrlSchemaValidator, (req, res, next) => {
    const obj = new Controller().boot(req, res);
    return obj.updateUrl();
  });

  router.delete('/:urlId', Globals.isAuthorised, deleteUrlSchemaValidator, (req, res, next) => {
    const obj = new Controller().boot(req, res);
    return obj.deleteUrl();
  })

  router.get('/red/:customUrl', (req, res, next) => {
      const obj = new Controller().boot(req, res);
      return obj.redirectUrl();
  });
  app.use(router);
}