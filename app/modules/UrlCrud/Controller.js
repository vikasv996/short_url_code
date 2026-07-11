const _ = require('lodash')
const moment = require('moment')
const Controller = require('../Base/Controller')
const exportLib = require('../../../lib/Exports')
const { URLSchema } = require('./Schema')
const configs = require('../../../configs/configs')
const Globals = require('../../services/Globals')
const { uploadToCloudinary, deleteAssetFromCloudinary } = require('../../services/FileUpload')
const { FileSchema } = require('../FileMeta/Schema')
const { CronSchema } = require('../CronJob/Schema')
const { getValueMap, MAXIMUM_FILE_SIZE_IN_BYTES, expiredUrlTemplate } = require('../../services/Constants')

class UrlController extends Controller {
  constructor () {
    super()
  }

  async addUrlShortener () {
    try {
      const currentUser = this.req.currentUser
      const { originalUrl, urlName, expirationDate } = this.req.body
      const isUrlPresent = await URLSchema.findOne(
        { adminId: currentUser._id, originalUrl },
        '_id'
      )
      if (isUrlPresent) {
        // console.log(isUrlPresent);
        // return exportLib.Error.handleError(this.res, {
        //   code: "CONFLICT",
        //   message: exportLib.ResponseEn.ORIGINAL_URL_ALREADY_PRESENT,
        // });
        throw new Error('Internal Server Error')
      }

      const uniqueId = Globals.getUniqueShortId()
      const urlObj = {
        originalUrl,
        shortUrl: uniqueId,
        adminId: currentUser._id,
        urlName,
        expirationDate
      }

      const urlRecord = await URLSchema.create(urlObj)
      if (!urlRecord) {
        return exportLib.Error.handleError(this.res, {
          code: 'INTERNAL_SERVER_ERROR',
          message: exportLib.ResponseEn.UNABLE_TO_SAVE_URL
        })
      }
      await Globals.storeAndStartCronJob(urlRecord._id, expirationDate)

      return exportLib.Response.sendResponse(this.res, {
        code: 'CREATED',
        message: exportLib.ResponseEn.SHORT_URL_CREATED,
        data: {
          url: configs.FileUrl + '/red/' + uniqueId
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

  async redirectUrl () {
    try {
      const { customUrl } = this.req.params
      // const headers = this.req.headers;
      // const client = new KeenTracking({
      //   projectId: configs.keenTrackingProjectId,
      //   writeKey: configs.keenTrackingWriteKey,
      // });

      // Add count of how many times this url is clicked
      if (!customUrl) {
        return exportLib.Error.handleError(this.res, {
          code: 'BAD_REQUEST',
          message: exportLib.ResponseEn.MISSING_CUSTOM_URL
        })
      }

      const url = await URLSchema.findOne({ shortUrl: customUrl })
      if (!url) {
        // return exportLib.Error.handleError(this.res, {
        //   code: "NOT_FOUND",
        //   message: exportLib.ResponseEn.CUSTOM_URL_NOT_PRESENT_IN_DB,
        // });
        return exportLib.Error.handleErrorRaw(this.res, {
          code: 'NOT_FOUND',
          htmlRes: expiredUrlTemplate
        })
      }

      if (url.isExpired) {
        return exportLib.Error.handleErrorRaw(this.res, {
          code: 'NO_LONGER_AVAILABLE',
          htmlRes: expiredUrlTemplate
        })
      }

      exportLib.Response.handleRedirect(this.res, {
        code: 'REDIRECTION',
        customUrl: url.originalUrl
      })

      try {
        await URLSchema.findOneAndUpdate(
          { shortUrl: customUrl },
          { $inc: { timesClicked: 1 }, $set: { lastVisitedOn: new Date() } },
          { new: true }
        )
      } catch (postResponseError) {
        console.log('redirectUrl-post-response-error', postResponseError)
      }
      // let workingEventBody = {
      //   item: {
      //     originalUrl: url.originalUrl,
      //     urlName: url.urlName,
      //     timesClicked: updatedUrlData.timesClicked,
      //   },
      //   ip_address: "${keen.ip}",
      //   user_agent: headers["user-agent"],
      //   keen: {
      //     addons: [
      //       {
      //         name: "keen:ip_to_geo",
      //         input: {
      //           ip: "ip_address",
      //         },
      //         output: "ip_geo_info",
      //       },
      //       {
      //         name: "keen:ua_parser",
      //         input: {
      //           ua_string: "user_agent",
      //         },
      //         output: "parsed_user_agent",
      //       },
      //     ],
      //   },
      // };
      // client.recordEvent("clicks", workingEventBody, (err, res) => {
      //   if (err) {
      //     console.log("KEEN.IO ERR", err);
      //   } else {
      //     console.log("KEEN.IO RESPONSE", res);
      //   }
      // });
    } catch (error) {
      console.log('redirectUrl-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }

  async listUrls () {
    try {
      const {
        currentUser,
        body: {
          skip = 0,
          limit = 5,
          filter: { isExpired, expireIn } = {},
          sortBy = 'expirationDate',
          sortOrder = 1
        }
      } = this.req

      const sortObject = { [sortBy]: sortOrder }
      const filterObj = { adminId: currentUser._id }

      if (typeof isExpired === 'boolean') {
        filterObj.isExpired = isExpired
      }

      if (expireIn) {
        const possibleValues = {
          '1m': { unit: 'minutes', amount: 1 },
          '1h': { unit: 'hours', amount: 1 },
          '1d': { unit: 'days', amount: 1 },
          '1M': { unit: 'months', amount: 1 }
        }

        if (!possibleValues[expireIn]) {
          return exportLib.Error.handleError(this.res, {
            code: 'BAD_REQUEST',
            message: exportLib.ResponseEn.INVALID_VALUE_EXPIRE_IN
          })
        }

        const currentDate = new Date()
        const { unit, amount } = possibleValues[expireIn]

        filterObj.$and = [
          { expirationDate: { $gte: currentDate } },
          {
            expirationDate: {
              $lte: moment(currentDate).add(amount, unit).toDate()
            }
          }
        ]
      }

      const aggregationResult = await URLSchema.aggregate().facet({
        list: [
          {
            $match: filterObj
          },
          {
            $project: {
              urlName: 1,
              shortUrl: 1,
              timesClicked: 1,
              createdAt: 1,
              isExpired: 1,
              expirationDate: 1,
              isFileUrl: { $cond: [{ $regexMatch: { input: '$originalUrl', regex: configs.MEDIA_CDN } }, true, false] }
            }
          },
          { $sort: sortObject },
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          {
            $match: filterObj
          },
          {
            $count: 'count'
          }
        ]
      })

      const { list, totalCount } = aggregationResult[0]
      const finalRes = list.map((item) => ({
        ...item,
        timeToExpire: Globals.displayRemTimeUsingMoment(item.expirationDate)
      }))

      return exportLib.Response.handleListingResponse(this.res, {
        code: 'SUCCESS',
        data: finalRes,
        total: totalCount[0]?.count || 0
      })
    } catch (error) {
      console.log('listUrls-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }

  async deleteUrl () {
    try {
      const currentUser = this.req.currentUser
      const { urlId } = this.req.params

      const isValidUrl = await URLSchema.findOne({
        _id: urlId,
        adminId: currentUser._id
      }).lean()

      if (!isValidUrl) {
        return exportLib.Error.handleError(this.res, {
          code: 'FORBIDDEN',
          message: exportLib.ResponseEn.UNABLE_TO_DELETE_URL
        })
      }

      const urlDeleted = await URLSchema.delete({ _id: urlId })
      if (!urlDeleted) {
        return exportLib.Error.handleError(this.res, {
          code: 'INTERNAL_SERVER_ERROR',
          message: exportLib.ResponseEn.ERROR_DELETING_URL
        })
      }
      exportLib.Response.sendResponse(this.res, {
        code: 'SUCCESS',
        message: exportLib.ResponseEn.URL_REMOVED
      })

      try {
        const jobInstance = getValueMap(urlId.toString())
        if (jobInstance) {
          jobInstance.stop()
          await CronSchema.deleteMany({ 'data.urlId': urlId })
        }
        const file = await FileSchema.findOne({ urlId }).select('metaData').lean()
        if (file) {
          await FileSchema.delete({ urlId })
          await deleteAssetFromCloudinary(file)
        }
      } catch (postResponseError) {
        console.log('deleteUrl-post-response-error', postResponseError)
      }
    } catch (error) {
      console.log('deleteUrl-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }

  async updateUrl () {
    try {
      const currentUser = this.req.currentUser
      const { urlId, urlName, expirationDate } = this.req.body
      const isValidUrl = await URLSchema.findOne({
        _id: urlId,
        adminId: currentUser._id
      }).lean()
      if (!isValidUrl) {
        return exportLib.Error.handleError(this.res, {
          code: 'FORBIDDEN',
          message: exportLib.ResponseEn.INVALID_URL_OWNER
        })
      }

      const urlUpdateObj = { urlName, expirationDate }
      if (expirationDate) {
        urlUpdateObj.isExpired = false
      }

      const urlUpdated = await URLSchema.findByIdAndUpdate(urlId, {
        $set: urlUpdateObj
      })

      if (urlUpdated) {
        if (expirationDate) {
          await CronSchema.updateMany(
            { 'data.urlId': urlId },
            { $set: { status: 'Complete' } }
          )
          await Globals.storeAndStartCronJob(urlId, expirationDate)
        }
        return exportLib.Response.sendResponse(this.res, {
          code: 'SUCCESS',
          message: exportLib.ResponseEn.URL_UPDATED_SUCCESSFULLY
        })
      } else {
        return exportLib.Error.handleError(this.res, {
          code: 'INTERNAL_SERVER_ERROR',
          message: exportLib.ResponseEn.ERROR_UPDATING_URL
        })
      }
    } catch (error) {
      console.log('updateUrl-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }

  async createFileShortUrl () {
    try {
      const {
        file,
        body: { urlName, expirationDate },
        currentUser
      } = this.req
      // console.log("FILE::");
      // console.log(file);
      if (file.size >= MAXIMUM_FILE_SIZE_IN_BYTES) {
        return exportLib.Error.handleError(this.res, {
          code: 'BAD_REQUEST',
          message: exportLib.ResponseEn.MAX_FILE_SIZE
        })
      }
      const { asset_id, public_id, format, resource_type, bytes, secure_url } =
        await uploadToCloudinary(file)

      const uniqueId = Globals.getUniqueShortId()
      const urlObj = {
        originalUrl: secure_url,
        shortUrl: uniqueId,
        adminId: currentUser._id,
        urlName,
        expirationDate
      }

      const urlRecord = await URLSchema.create(urlObj)
      if (!urlRecord) {
        return exportLib.Error.handleError(this.res, {
          code: 'INTERNAL_SERVER_ERROR',
          message: exportLib.ResponseEn.UNABLE_TO_SAVE_URL
        })
      }

      const fileObj = {
        urlId: urlRecord._id,
        metaData: { asset_id, public_id, resource_type },
        format,
        size: bytes
      }

      await FileSchema.create(fileObj)
      await Globals.storeAndStartCronJob(urlRecord._id, expirationDate)
      return exportLib.Response.sendResponse(this.res, {
        code: 'SUCCESS',
        message: exportLib.ResponseEn.SHORT_URL_CREATED,
        data: {
          url: configs.FileUrl + '/red/' + uniqueId
        }
      })
    } catch (error) {
      console.log('createFileShortUrl-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }

  async bulkCreate () {
    try {
      const {
        file,
        currentUser
      } = this.req
      const bodyKeys = ['originalUrl', 'urlName', 'expirationDate']
      const globalObject = new Globals()

      console.log('FILE::')
      console.log(file)
      if (!file) {
        return exportLib.Error.handleError(this.res, {
          code: 'BAD_REQUEST',
          message: exportLib.ResponseEn.BULK_CSV_FILE_NOT_FOUND
        })
      }

      const records = await globalObject.processCsvData(file.path)

      const uniqueRecords = _.uniqBy(records, record => record[0]?.trim())
      console.log('uniqueRecords', uniqueRecords)

      if (uniqueRecords.length !== records.length) {
        return exportLib.Error.handleError(this.res, {
          code: 'BAD_REQUEST',
          message: exportLib.ResponseEn.DUPLICATES_FOUND
        })
      }

      const newRecords = JSON.parse(JSON.stringify(records))
      const [keyHeaders] = newRecords.splice(0, 1)
      console.log('Original Records', records)
      if (!_.isEqual(bodyKeys, keyHeaders)) {
        return exportLib.Error.handleError(this.res, {
          code: 'BAD_REQUEST',
          message: exportLib.ResponseEn.INVALID_HEADER_KEYS
        })
      }

      if (newRecords.length > 100) {
        return exportLib.Error.handleError(this.res, {
          code: 'BAD_REQUEST',
          message: exportLib.ResponseEn.NO_OF_URLS_EXCEEDED
        })
      }

      exportLib.Response.sendResponse(this.res, {
        code: 'SUCCESS',
        message: exportLib.ResponseEn.FILE_RECIEVED
      })

      await globalObject
        .storeCsvUrlData(newRecords, currentUser)
        .then((data) => {
          console.log('File processed and email sent', data)
        })
        .catch((err) => {
          console.log('Error while processing file', err)
        })
    } catch (error) {
      console.log('bulkCreate-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }

  async viewUrlDetails () {
    try {
      const currentUser = this.req.currentUser
      const { urlId } = this.req.params

      const result = await URLSchema.aggregate([
        {
          $match: {
            _id: new exportLib.ObjectId(urlId),
            adminId: currentUser._id
          }
        },
        {
          $lookup: {
            from: 'fileschemas',
            localField: '_id',
            foreignField: 'urlId',
            as: 'file'
          }
        },
        {
          $project: {
            urlName: 1,
            originalUrl: 1,
            shortUrl: {
              $concat: [configs.FileUrl, '/red/', '$shortUrl']
            },
            timesClicked: 1,
            expirationDate: 1,
            createdAt: 1,
            lastVisitedOn: 1,
            isExpired: 1,
            'file._id': 1,
            'file.metaData': 1,
            'file.format': 1,
            'file.size': 1,
            'file.createdAt': 1
          }
        }
      ])

      if (!result.length) {
        return exportLib.Error.handleError(this.res, {
          code: 'NOT_FOUND',
          message: exportLib.ResponseEn.URL_NOT_FOUND
        })
      }
      // After fetching record from database
      // if (result[0].isExpired === true) {
      //   return exportLib.Error.handleError(this.res, {
      //     code: "FORBIDDEN",
      //     message: 'This URL is expired. Unable to view. Please contact admin',
      //   });
      // }
      // Before sendind data to client
      return exportLib.Response.sendResponse(this.res, {
        code: 'SUCCESS',
        message: exportLib.ResponseEn.DETAILS_FETCHED_SUCCESSFULLY,
        data: result[0]
      })
    } catch (error) {
      console.log('viewUrlDetails-error', error)
      return exportLib.Error.handleError(this.res, {
        code: 'INTERNAL_SERVER_ERROR',
        message: error
      })
    }
  }
}

module.exports = UrlController
