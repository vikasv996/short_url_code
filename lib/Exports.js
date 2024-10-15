const ErrorHandler = require('../lib/ErrorHandler')
const ResponseHandler = require('../lib/ResponseHandler')
const Error = new ErrorHandler()
const Response = new ResponseHandler()
const ResponseEn = require('../app/locales/en.json')
const { ObjectId } = require('mongoose').Types;

module.exports = {
  Error,
  Response,
  ResponseEn,
  ObjectId
}
