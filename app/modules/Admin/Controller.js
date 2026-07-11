const _ = require('lodash')
const Controller = require('../Base/Controller')
const exportLib = require('../../../lib/Exports')
const { Admin } = require('./Schema')
const Globals = require('../../services/Globals')
const { getValueMap, setValueMap } = require('../../services/Constants')

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
      const globalClassObject = new Globals()
      const admin = await Admin.findOne({ emailId: reqBody.emailId }).select('_id password').lean()
      if (_.isEmpty(admin)) {
        return exportLib.Error.handleError(this.res, {
          code: 'NOT_FOUND',
          message: exportLib.ResponseEn.ADMIN_NOT_EXIST
        })
      }

      const isPasswordCorrect = await globalClassObject.comparePasswordHash(reqBody.password, admin.password)

      if (!isPasswordCorrect) {
        return exportLib.Error.handleError(this.res, {
          code: 'BAD_REQUEST',
          message: exportLib.ResponseEn.INVALID_PASSWORD
        })
      }

      const tokenObject = { id: admin._id }
      const token = await globalClassObject.generateToken(tokenObject)

      // let options = {
      //   maxAge: 20 * 60 * 1000, // would expire in 20minutes
      //   httpOnly: true, // The cookie is only accessible by the web server
      //   secure: true,
      //   sameSite: "None",
      // };
      // this.res.cookie("SessionID", token, options);

      this.res.setHeader('Name', 'Sumit')

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

  async logout () {
    try {
      const token = this.req.headers.authorization
      if (!token) {
        return exportLib.Error.handleError(this.res, {
          code: 'UNAUTHORIZED',
          message: exportLib.ResponseEn.TOKEN_WITH_API
        })
      }

      const value = getValueMap(token)
      console.log('VALUE', value)
      if (!value) setValueMap(token, token)
      // this.res.setHeader('Clear-Site-Data', '"cookies"');

      return exportLib.Response.sendResponse(this.res, {
        code: 'SUCCESS',
        message: exportLib.ResponseEn.LOGOUT_SUCCESS
      })
    } catch (error) {
      console.log('logout-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }
}

module.exports = AdminController
