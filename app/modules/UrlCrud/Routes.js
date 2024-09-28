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
  const { uploadSingleFile, uploadCsv } = require('../../services/FileUpload')

  router.post('/insert-url', Globals.isAuthorised, insertUrlSchemaValidator, (req, res, next) => {
    const obj = new Controller().boot(req, res);
    return obj.addUrlShortener();
  });

  router.post('/list-url', Globals.isAuthorised, (req, res, next) => {
    const obj = new Controller().boot(req, res);
    return obj.listUrls();
  });

  router.put('/update-url', Globals.isAuthorised, updateUrlSchemaValidator, (req, res, next) => {
    const obj = new Controller().boot(req, res);
    return obj.updateUrl();
  });

  router.delete('/url/:urlId', Globals.isAuthorised, deleteUrlSchemaValidator, (req, res, next) => {
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

  router.post('/bulk-create', Globals.isAuthorised, uploadCsv('file'), (req, res) => {
    const obj = new Controller().boot(req, res);
    return obj.bulkCreate();
  })

  app.use(router);
}