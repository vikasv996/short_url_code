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
  NOT_ACCEPTABLE: 406
}

class ErrorHandler {
  handleError (res, errorObj) {
    const msg = typeof errorObj.message === 'string' ? errorObj.message : 'Internal server error';
    const code = errorCodes[errorObj.code];
    res.status(code).send({ status: code, message: msg })
  }
}

module.exports = ErrorHandler
