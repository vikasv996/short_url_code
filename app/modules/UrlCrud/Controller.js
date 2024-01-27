const _ = require('lodash')
const ShortUniqueId = require('short-unique-id');
const Controller = require('../Base/Controller')
const exportLib = require('../../../lib/Exports')
const { URLSchema } = require('./Schema')
const configs = require('../../../configs/configs')
const Globals = require('../../services/Globals')


class UrlController extends Controller {
  constructor() {
    super();
  }

  async addUrlShortener() {
    try {
      const currentUser = this.req.currentUser;
      const { originalUrl, urlName } = this.req.body;
      if (!originalUrl) {
        return exportLib.Error.handleError(this.res, {
          code: 'BAD_REQUEST',
          message: exportLib.ResponseEn.MISSING_ORIGINAL_URL
        })
      }

      if (!urlName) {
        return exportLib.Error.handleError(this.res, {
          code: 'BAD_REQUEST',
          message: exportLib.ResponseEn.MISSING_URLNAME
        })
      }
      const isUrlPresent = await URLSchema.findOne({ originalUrl }, '_id');
      if (isUrlPresent) {
        console.log(isUrlPresent);
        return exportLib.Error.handleError(this.res, {
          code: 'CONFLICT',
          message: exportLib.ResponseEn.ORIGINAL_URL_ALREADY_PRESENT
        })
      }

      if (!Globals.isUrlValid(originalUrl)) {
        return exportLib.Error.handleError(this.res, {
          code: 'BAD_REQUEST',
          message: exportLib.ResponseEn.INVALID_ORIGINAL_URL
        })
      }

      const uniqueId = new ShortUniqueId({ dictionary: 'alphanum_lower', length: 8 }).rnd();
      const urlObj = {
        originalUrl,
        shortUrl: uniqueId,
        adminId: currentUser._id,
        urlName
      }

      const urlRecord = await URLSchema.create(urlObj);
      if (!urlRecord) {
        return exportLib.Error.handleError(this.res, {
          code: 'INTERNAL_SERVER_ERROR',
          message: exportLib.ResponseEn.UNABLE_TO_SAVE_URL
        })
      }

      return exportLib.Response.sendResponse(this.res, {
        code: "SUCCESS",
        message: exportLib.ResponseEn.SHORT_URL_CREATED,
        data: {
            url: configs.host + '/red/' + uniqueId
        }
      })
    } catch (error) {
      console.log('redirectUrl-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }

  async redirectUrl() {
    try {
      const {customUrl} = this.req.params;
      const customUrls = {
        'old-url-1': 'https://www.google.com/',
        'old-url-2': 'https://www.linkedin.com/'
        // Add more custom URLs as needed
      }

      // Add count of how many times this url is clicked

      if (!customUrl) {
        return exportLib.Error.handleError(this.res, {
          code: 'BAD_REQUEST',
          message: exportLib.ResponseEn.MISSING_CUSTOM_URL
        })
      }

      const url = await URLSchema.findOne({ shortUrl: customUrl });
      if (!url) {
        return exportLib.Error.handleError(this.res, {
          code: 'NOT_FOUND',
          message: exportLib.ResponseEn.CUSTOM_URL_NOT_PRESENT_IN_DB
        })
      }
      console.log("url");
      console.log(url);

      exportLib.Response.handleRedirect(this.res, {
        code: 'REDIRECTION',
        customUrl: url.originalUrl
      })

      await URLSchema.findOneAndUpdate({ shortUrl: customUrl }, { $inc: { timesClicked: 1 } });
      console.log("URL clicked");
      // if (customUrls[customUrl]) {
      //   // Redirect to the custom URL
      //   // return res.redirect(301, customUrls[customUrl])
      //   return exportLib.Response.handleRedirect(this.res, {
      //     code: 'REDIRECTION',
      //     customUrl: customUrls[customUrl]
      //   })
      // }

      // return exportLib.Response.sendResponse(this.res, {
      //   code: 'NOT_FOUND',
      //   message: exportLib.ResponseEn.URL_NOT_FOUND
      // })
    } catch (error) {
      console.log('redirectUrl-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }

  async listUrls() {
    try {
      const currentUser = this.req.currentUser;
      let reqQuery = this.req.query;
      reqQuery.page = reqQuery.page && parseInt(reqQuery.page) > 0 ? parseInt(reqQuery.page) : 1;
      let perPage = reqQuery.perPage && parseInt(reqQuery.perPage) > 0 ? parseInt(reqQuery.perPage) : 10;
      let skip = (reqQuery.page - 1) * (perPage);
      let sortBy = {  };

      let filter = { adminId: currentUser._id };
      let projection = 'urlName shortUrl timesClicked createdAt';
      let result = await URLSchema.find(filter).sort(sortBy).skip(skip).limit(perPage).select(projection).lean();
      let totalCount = await URLSchema.count(filter);

      return exportLib.Response.handleListingResponse(this.res, {
          code: 'SUCCESS',
          data: result,
          page: reqQuery.page,
          perPage,
          total: totalCount
      })
    } catch (error) {
      console.log('listUrls-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }

  async deleteUrl() {
    try {
      // const currentUser = this.req.currentUser;
      const {customUrl} = this.req.params;

      if (!customUrl) {
        return exportLib.Error.handleError(this.res, {
          code: 'BAD_REQUEST',
          message: exportLib.ResponseEn.MISSING_CUSTOM_URL
        })
      }

      const isUrlExist = await URLSchema.findOne({shortUrl: customUrl});
      if (!isUrlExist) {
        return exportLib.Error.handleError(this.res, {
          code: 'NOT_FOUND',
          message: exportLib.ResponseEn.URL_NOT_FOUND
        })
      }

      await URLSchema.delete({shortUrl: customUrl});
      return exportLib.Response.sendResponse(this.res, {
        code: "SUCCESS",
        message: exportLib.ResponseEn.URL_REMOVED
      })

    } catch (error) {
      console.log('deleteUrl-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }
}

module.exports = UrlController;
