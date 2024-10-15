/****************************
 SECURITY TOKEN HANDLING
 ****************************/
const _ = require('lodash')
const jwt = require('jsonwebtoken')
const moment = require('moment');
const bcrypt = require('bcrypt');
const { parse } = require("csv-parse");
const ShortUniqueId = require('short-unique-id');
const Handlebars = require("handlebars");
const fs = require("fs");
const config = require('../../configs/configs')
const { AuthTokens } = require('../modules/Authentication/Schema')
const { Admin } = require('../modules/Admin/Schema')
const { CronSchema } = require('../modules/CronJob/Schema')
const { URLSchema } = require('../modules/UrlCrud/Schema')
const exportLib = require('../../lib/Exports')
const { cronJobToExpireUrlsBySingle } = require('../../configs/cronScheduler')
const { bulkHtmlTemplate, emailTransporter, getValueMap } = require('../services/Constants')

class Globals {
  generateToken(params) {
    return new Promise(async (resolve, reject) => {
      try {
        const expiryTime = 3600; // 1 hour in seconds
        const token = jwt.sign(
          {
            id: params.id,
            algorithm: "HS256",
            // exp: Math.floor(Date.now() / 1000) + expiryTime,
          },
          config.access_token_secret, { expiresIn: expiryTime }
        );

        params.token = token;
        params.adminId = params.id;
        console.log("params");
        console.log(params);
        const auth = await AuthTokens.findOne({ adminId: params.id })
          .select("_id")
          .lean();
        delete params.id;
        if (_.isEmpty(auth)) {
          await AuthTokens.create(params);
        } else {
          await AuthTokens.findByIdAndUpdate(auth._id, { $set: params });
        }

        return resolve(token);
      } catch (err) {
        console.log("Get token", err);
        return reject({ message: err, status: 0 });
      }
    });
  }

  static async isAuthorised(req, res, next) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return exportLib.Error.handleError(res, {
          code: "UNAUTHORIZED",
          message: exportLib.ResponseEn.TOKEN_WITH_API,
        });
      }

      const value = getValueMap(token);
      console.log("isAuthorised::value", value);
      if (value) {
        return exportLib.Error.handleError(res, {
          code: "UNAUTHORIZED",
          message: exportLib.ResponseEn.LOGIN_AGAIN,
        });
      }
      const authenticate = new Globals();

      const tokenCheck = await authenticate.checkToken(token);
      if (!tokenCheck) {
        return exportLib.Error.handleError(res, {
          code: "UNAUTHORIZED",
          message: exportLib.ResponseEn.INVALID_TOKEN,
        });
      }

      const userExist = await authenticate.checkAdmin(token);
      if (!userExist) {
        return exportLib.Error.handleError(res, {
          code: "UNAUTHORIZED",
          message: exportLib.ResponseEn.ADMIN_NOT_EXIST,
        });
      }

      req.currentUser = userExist;
      next();
    } catch (err) {
      console.log("Token authentication", err);
      return res.send({ status: 0, message: err });
    }
  }

  checkToken(token) {
    return new Promise((resolve, reject) => {
      try {
        jwt.verify(
          token,
          config.access_token_secret,
          async (err, decoded) => {
            if (err) {
              return resolve(false);
            }

            if (_.isEmpty(decoded)) {
              return resolve(false);
            }
            const authenticate = await AuthTokens.findOne({ token });
            if (authenticate) return resolve(true);
            return resolve(false);
          }
        );
      } catch (err) {
        console.log("Error checking token");
        return resolve({ message: err, status: 0 });
      }
    });
  }

  checkAdmin(token) {
    return new Promise(async (resolve, reject) => {
      try {
        // Initialisation of variables
        const decoded = jwt.decode(token, {});
        if (!decoded) {
          return resolve(false);
        }
        const adminId = decoded.id;

        const user = await Admin.findById(adminId);
        if (user) return resolve(user);
        return resolve(false);
      } catch (err) {
        console.log("Error fetching admin in db");
        return reject({ message: err, status: 0 });
      }
    });
  }

  static isUrlValid(url) {
    const regex =
      /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?/i;

    if (url && typeof url === "string") {
      return regex.test(url);
    }
    return false;
  }

  static async storeAndStartCronJob(...args) {
    // Create a job instance in database for persistance
    let [urlId, expirationDate] = args;
    let cronJobObjToSave = {
      data: { urlId },
      type: exportLib.ResponseEn.CRON_TYPE_NO_REPEATABLE,
      scheduledTime: expirationDate,
      onTickfuncName: "validateJobOnTickFunc",
      onCompFuncName: "validateJobOnCompleteFunc",
      status: exportLib.ResponseEn.CRON_STATUS_INCOMPLETE,
    };
    let jobPersisted = await CronSchema.create(cronJobObjToSave);
    if (jobPersisted) {
      cronJobToExpireUrlsBySingle(jobPersisted._id, urlId, expirationDate);
    }
  }

  static displayRemTimeUsingMoment(date) {
    const units = [
      { label: "year", format: "years" },
      { label: "month", format: "months" },
      { label: "week", format: "weeks" },
      { label: "day", format: "days" },
      { label: "hour", format: "hours" },
      { label: "minute", format: "minutes" },
      { label: "second", format: "seconds" },
    ];

    for (let unit of units) {
      const diff = getTimeDiff(date, unit.format);
      if (diff > 0) {
        const label = diff === 1 ? unit.label : `${unit.label}s`;
        return `${diff} ${label}`;
      }
    }

    return "0";
  }

  async generatePasswordHash(password) {
    const saltRounds = 10;
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, saltRounds).then(hash => {
        return resolve(hash);
      })
      .catch(err => {
        console.log("Error generating Hash::", err);
        return reject(err)
      })
    })
  }

  async comparePasswordHash(password, pwdhash) {
    try {
      const isPwdCorrect = await bcrypt.compare(password, pwdhash);
      console.log("isPwdCorrect::", isPwdCorrect);
      return isPwdCorrect;
    } catch (err) {
      console.log("Bcrypt comare error", err);
      throw err;
    }
  }

  static getUniqueShortId() {
    return new ShortUniqueId({ dictionary: "alphanum_lower", length: 8 }).rnd();
  }

  async processCsvData(file) {
    return new Promise((resolve, reject) => {
      const records = [];
      const csvParserOptions = { delimiter: "," };
      const readable = fs.createReadStream(file).pipe(parse(csvParserOptions));
  
      readable.on("data", (row) => {
        records.push(row);
      })
      readable.on("error", function (error) {
        console.log(error.message, error);
        return reject(error.message);
      })
      readable.on("end", function () {    
        console.log("File read successful");
        return resolve(records);
      });
    })
  }

  async storeCsvUrlData(records, currentUser) {
    return new Promise(async (resolve, reject) => {
      try {
        let urlDetailsByEmail = [];
        for (let i = 0; i < records.length; i++) {
          let urlDetailsByEmailObject = {};
          let [originalUrl, urlName, expirationDate] = records[i];
          console.log("------originalUrl, urlName, expirationDate------");
          console.log(originalUrl, urlName, expirationDate);
          if (!originalUrl || !urlName || !expirationDate) {
            throw {
              code: 'BAD_REQUEST',
              message: exportLib.ResponseEn.INVALID_DATA
            }
          }
          originalUrl = originalUrl.trim();
          urlName = urlName.trim();
          expirationDate = expirationDate.trim();

          const isUrlPresent = await URLSchema.findOne({ adminId: currentUser._id, originalUrl }, "_id");
          if (isUrlPresent) {
            throw {
              code: 'CONFLICT',
              message: exportLib.ResponseEn.ORIGINAL_URL_ALREADY_PRESENT
            }
          }

          const uniqueId = Globals.getUniqueShortId();
          const urlObj = {
            originalUrl,
            shortUrl: uniqueId,
            adminId: currentUser._id,
            urlName,
            expirationDate,
          };

          const urlRecord = await URLSchema.create(urlObj);
          if (urlRecord) {
            await Globals.storeAndStartCronJob(urlRecord._id, expirationDate);
            urlDetailsByEmailObject["srNo"] = i + 1;
            urlDetailsByEmailObject["shortUrl"] = config.FileUrl + "/red/" + uniqueId;
            urlDetailsByEmailObject["urlName"] = urlName;
            urlDetailsByEmail.push(urlDetailsByEmailObject);
          }
        }
        const template = Handlebars.compile(bulkHtmlTemplate);
        const result = template({ urlArray: urlDetailsByEmail });
        const mailOptions = {
          from: '"ShortUrl"<codelearner309@gmail.com>',
          to: "valechhavicky@gmail.com",
          subject: "Short URLs Generated",
          html: result
        };
        emailTransporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email: ", error);
          } else {
            console.log("Email sent: ", info);
          }
        });
        resolve(1);
      } catch (err) {
        console.log("storeCsvUrlData", err);
        return reject(err);
      }
    });
  }
}

function getTimeDiff(expirationDate = new Date(), format) {
  const validFormats = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];
  return validFormats.includes(format) ? moment(expirationDate).diff(new Date(), format) : 0;
}

module.exports = Globals
