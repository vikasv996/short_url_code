const _ = require('lodash')
const ShortUniqueId = require('short-unique-id');
const KeenTracking = require('keen-tracking');
const Controller = require('../Base/Controller')
const exportLib = require('../../../lib/Exports')
const { URLSchema } = require('./Schema')
const configs = require('../../../configs/configs')
const Globals = require('../../services/Globals')
const {cronJobToExpireUrlsBySingle} = require('../../../configs/cronScheduler');


class UrlController extends Controller {
  constructor() {
    super();
  }

  async addUrlShortener() {
    try {
      const currentUser = this.req.currentUser;
      const { originalUrl, urlName, expirationDate } = this.req.body;
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
        urlName,
        expirationDate
      }

      const urlRecord = await URLSchema.create(urlObj);
      if (!urlRecord) {
        return exportLib.Error.handleError(this.res, {
          code: 'INTERNAL_SERVER_ERROR',
          message: exportLib.ResponseEn.UNABLE_TO_SAVE_URL
        })
      }

      cronJobToExpireUrlsBySingle(urlRecord._id, expirationDate);

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
      const headers = this.req.headers;
      const client = new KeenTracking({
        projectId: configs.keenTrackingProjectId,
        writeKey: configs.keenTrackingWriteKey
      });

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

      if (url.isExpired) {
        return exportLib.Error.handleError(this.res, {
          code: 'UNPROCESSABLE_ENTITY',
          message: exportLib.ResponseEn.URL_EXPIRED
        })
      }

      await URLSchema.findOneAndUpdate({ shortUrl: customUrl }, { $inc: { timesClicked: 1 }, $set: { lastVisitedOn: new Date } });

      // let eventArray = {
      //   item: {
      //     originalUrl: url.originalUrl,
      //     urlName: url.urlName,
      //   },
      //   page: {
      //     url: url.originalUrl
      //   },
      //   referrer: {
      //     info: { /* Enriched */ },
      //     url: `http://localhost:4000/red/${url.shortUrl}`
      //   },
      //   // user_agent: headers['user-agent'],
      //   keen: {
      //     addons: [
      //       // {
      //       //   name: 'keen:ua_parser',
      //       //   input: {
      //       //     ua_string: 'user_agent'
      //       //   },
      //       //   output: 'parsed_user_agent'
      //       // },
      //       {
      //         name: 'keen:referrer_parser',
      //         input: {
      //           page_url: 'page.url',
      //           referrer_url: 'referrer.url'
      //         },
      //         output: 'referrer.info'
      //       }
      //     ],
      //   },
      // };
      let workingEventBody = {
        item: {
          originalUrl: url.originalUrl,
          urlName: url.urlName,
        },
        ip_address: "${keen.ip}",
        user_agent: headers['user-agent'],
        keen: {
          addons: [
            {
              name: "keen:ip_to_geo",
              input: {
                ip: "ip_address",
              },
              output: "ip_geo_info",
            },
            {
              name: 'keen:ua_parser',
              input: {
                ua_string: 'user_agent'
              },
              output: 'parsed_user_agent'
            }
          ],
        },
      }
      client.recordEvent('clicks', workingEventBody, (err, res) => {
        if (err) {
          console.log("KEEN.IO ERR", err);
        } else {
          console.log("KEEN.IO RESPONSE", res);
        }
      });
      exportLib.Response.handleRedirect(this.res, {
        code: 'REDIRECTION',
        customUrl: url.originalUrl
      })
      console.log("URL clicked");
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
      let sortBy = { expirationDate: 1 };

      let filter = { adminId: currentUser._id };
      // let projection = 'urlName shortUrl timesClicked createdAt';
      // let result = await URLSchema.find(filter).sort(sortBy).skip(skip).limit(perPage).select(projection).lean();
      // let totalCount = await URLSchema.count(filter);

      let aggregtionResult = await URLSchema.aggregate().facet({
        list: [
          {
            $match: filter
          },
          {
            $project: {
              urlName: "$urlName",
              shortUrl: "$shortUrl",
              timesClicked: "$timesClicked",
              createdAt: "$createdAt",
              isExpired: "$isExpired",
              expirationDate: "$expirationDate",
              timeToExpire: {
                $dateDiff: {
                  startDate: new Date(),
                  endDate: "$expirationDate",
                  unit: 'hour'
                }
              }
            }
          },
          {
            $addFields: {
              timeRemaining: { $concat: [{ $toString: "$$timeToExpire" }, "h"] }
            }
          },
          { $sort: sortBy },
          { $skip: skip },
          { $limit: perPage }
        ],
        totalCount: [
          {
            $match: filter
          },
          {
            $count: "count"
          }
        ]
      })
      aggregtionResult = aggregtionResult[0];

      return exportLib.Response.handleListingResponse(this.res, {
          code: 'SUCCESS',
          data: aggregtionResult.list,
          page: reqQuery.page,
          perPage,
          total: aggregtionResult.totalCount[0].count
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
