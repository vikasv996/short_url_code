module.exports = (app, express) => {

  const router = express.Router();
  const Controller = require('./Controller');
  const { 
    insertUrlSchemaValidator,
    deleteUrlSchemaValidator,
    updateUrlSchemaValidator,
    uploadFileSchemaValidator
  } = require('../../services/Validators');
  const Globals = require("../../services/Globals");
  const { uploadSingleFile } = require('../../services/FileUpload')

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

  router.post('/upload-file', Globals.isAuthorised, uploadSingleFile('file'), uploadFileSchemaValidator, (req, res, next) => {
    const obj = new Controller().boot(req, res);
    return obj.createFileShortUrl();
  });

  router.post('/bulk-create', Globals.isAuthorised, uploadSingleFile('file'), (req, res) => {
    const obj = new Controller().boot(req, res);
    return obj.bulkCreate();
  })

  app.use(router);
}