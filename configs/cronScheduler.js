const { CronJob } = require("cron");
const moment = require("moment");
const fs = require('fs');
const path = require('path');
const { URLSchema } = require("../app/modules/UrlCrud/Schema");
const { CronSchema } = require("../app/modules/CronJob/Schema");

module.exports = {

  cronJobToExpireUrlsInBulk: async () => {
    // let expTime = moment().add(5, 'second').toDate();
    // console.log("current time::", moment().toDate());
    // console.log("expTime::", expTime);
    const job = CronJob.from({
      cronTime: "0 0 */12 * * *",
      onTick: async () => {
        console.log("Running Cron Job every 12 hours", new Date());

        // await URLSchema.updateMany({ expirationDate: { $lte: new Date() } }, { isExpired: true });
        // console.log("updateExpiredUrls");
        // console.log(updateExpiredUrls);
        // await URLSchema.delete({ isExpired: true });
      },
      start: true,
    });
  },
  
  cronJobToExpireUrlsBySingle: async (jobId , urlId, expirationDate) => {
    console.log("Cron Job details", { jobId, urlId, expirationDate: moment(expirationDate), currentDate: moment(new Date()) });
    if (moment(expirationDate).isSameOrAfter(moment(new Date()))) {
      console.log("Scheduling the cron job for the specified date/time");
      const job = CronJob.from({
        cronTime: moment(expirationDate).toDate(),
        onTick: function () {
          validateJobOnTickFunc(urlId, this);
        },
        onComplete: function () {
          validateJobOnCompleteFunc(jobId);
        },
      });

      job.start();
    } else {
      console.log("Set the status as complete for the past jobs.");
      await URLSchema.findByIdAndUpdate(urlId, { $set: { isExpired: true } });
      await CronSchema.findByIdAndUpdate(jobId, { $set: { status: "Complete" } });
    }
  },

  cronJobToPurgeUploadedFiles: async () => {
    const publicPath = path.join(global.rootPath, 'public')
    const job = CronJob.from({
      cronTime: '*/60 * * * * *',
      onTick: function() {
        console.log("Job will run every minute:", moment().toLocaleString());
        fs.readdir(publicPath, (err, files) => {
          if (err) {
            console.log("Err", err);
            return;
          }
          console.log("FILES");
          console.log(files);
          let i = 1;
          for (const file of files) {
            console.log("i:", i, file);
            fs.unlinkSync(path.join(publicPath, file));
            i++;
          }
        })
      },
      start: true
    })
  }

};

async function validateJobOnTickFunc(urlId, context) {
    console.log("validateJobOnTickFunc called", urlId);
    await URLSchema.findByIdAndUpdate(urlId, { $set: { isExpired: true } });
    context.stop();
}

async function validateJobOnCompleteFunc(jobId) {
    console.log("validateJobOnCompleteFunc called", jobId);
    await CronSchema.findByIdAndUpdate(jobId, { $set: { status: "Complete" } });
}
