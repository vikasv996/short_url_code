const _ = require('lodash')
const { validationResult } = require('express-validator')
const { body, check, query, header, param } = require('express-validator')
const exportLib = require('../../../lib/Exports')

class Validator {
  static registerValidator () {
    try {
      return [
        check('emailId').trim().toLowerCase().exists().withMessage(exportLib.ResponseEn.EMAIL_ID_REQUIRED)
          .isEmail().withMessage(exportLib.ResponseEn.INVALID_EMAIL),
        check('password').trim()
          .isLength({ min: 5 }).withMessage(exportLib.ResponseEn.PASSWORD_VALIDATION_LENGTH)
      ]
    } catch (error) {
      return error
    }
  }

  static validate (req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return exportLib.Error.handleError(res, { code: 'UNPROCESSABLE_ENTITY', message: errors.errors[0].msg })
      }
      next()
    } catch (error) {
      return exportLib.Error.handleError(res, { status: false, code: 'INTERNAL_SERVER_ERROR', message: error })
    }
  }
}

module.exports = Validator
