const _ = require('lodash')
const Controller = require('../Base/Controller')
const exportLib = require('../../../lib/Exports')
const { Admin } = require('./Schema')
const Globals = require('../../services/Globals')

class AdminController extends Controller {
  constructor () {
    super()
  }

  async register () {
    try {
      const reqBody = this.req.body

      const user = await Admin.findOne({ emailId: reqBody.emailId })
      if (!_.isEmpty(user)) {
        return exportLib.Error.handleError(this.res, {
          code: 'UNPROCESSABLE_ENTITY',
          message: exportLib.ResponseEn.ADMIN_EXIST
        })
      }

      const userAdded = await Admin.create(reqBody)
      if (_.isEmpty(userAdded)) {
        return exportLib.Error.handleError(this.res, {
          code: 'INTERNAL_SERVER_ERROR',
          message: exportLib.ResponseEn.ADMIN_NOT_REGISTERED
        })
      }

      return exportLib.Response.handleResponse(this.res, {
        code: 'SUCCESS',
        data: {
          adminId: userAdded._id
        },
        message: exportLib.ResponseEn.ADMIN_SAVED
      })
    } catch (error) {
      console.log('register-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }

  async login () {
    try {
      const reqBody = this.req.body
      const admin = await Admin.findOne({ emailId: reqBody.emailId }).lean()
      if (_.isEmpty(admin)) {
        return exportLib.Error.handleError(this.res, {
          code: 'NOT_FOUND',
          message: exportLib.ResponseEn.ADMIN_NOT_EXIST
        })
      }

      if (reqBody.password !== admin.password) {
        return exportLib.Error.handleError(this.res, {
          code: 'UNAUTHORIZED',
          message: exportLib.ResponseEn.INVALID_PASSWORD
        })
      }

      const tokenObject = { id: admin._id }
      const token = await new Globals().generateToken(tokenObject)

      return exportLib.Response.sendResponse(this.res, {
        code: 'SUCCESS',
        message: exportLib.ResponseEn.LOGIN_SUCCESS,
        data: {
          accessToken: token
        }
      })
    } catch (error) {
      console.log('login-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }
}

module.exports = AdminController
