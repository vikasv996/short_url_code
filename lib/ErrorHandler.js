const errorCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  UNPROCESSABLE_ENTITY: 422,
  NOT_FOUND: 404,
  REQUEST_TIMEOUT: 408,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  CONFLICT: 409,
  NO_LONGER_AVAILABLE: 410,
  NOT_ACCEPTABLE: 406
}

class ErrorHandler {
  handleError (res, {message, code, error = {}}) {
    const msg = typeof message === 'string' ? message : 'Internal server error';
    const statusCode = errorCodes[code];
    res.status(statusCode).send({ status: statusCode, message: msg, error })
  }

  handleErrorRaw(res, { code, htmlRes }) {
    const statusCode = errorCodes[code];
    res.status(statusCode).send(htmlRes);
  }

}

module.exports = ErrorHandler
