const { CronJob } = require("cron");
const moment = require("moment");
const Globals = require('../app/services/Globals');
const { URLSchema } = require("../app/modules/UrlCrud/Schema");
const { CronSchema } = require("../app/modules/CronJob/Schema");
const {
  cronJobToExpireUrlsBySingle,
  cronJobToPurgeUploadedFiles,
} = require("./cronScheduler");
// initCronPostRestart
module.exports = {
  startIncompleteJobs: async () => {
    let fetchIncompleteJobs = await CronSchema.find(
      { type: "Once", status: "Incomplete" },
      "data scheduledTime"
    ).lean();
    console.log("fetchIncompleteJobs");
    console.log(fetchIncompleteJobs);
    if (!fetchIncompleteJobs.length) {
      console.log("All the cron jobs are in complete state.");
      return;
    }
    for (let job of fetchIncompleteJobs) {
      let {
        _id,
        scheduledTime,
        data: { urlId },
      } = job;
      console.log("Executing incomplete jobs...");
      cronJobToExpireUrlsBySingle(_id, urlId, scheduledTime);
    }
  },

  jobToPurgeUploadedFiles: async () => {
    // scheduleCronJobsForValidUrls();
    await cronJobToPurgeUploadedFiles();
  },

  initiateInacticeJobsByUrlId: async () => {
    CronJob.from({
      cronTime: "0 */60 * * * *",
      onTick: async function () {
        console.log("Job will run every minute:", moment().toLocaleString());
        let result = await URLSchema.aggregate([
          [
            {
              $match: { isExpired: false },
            },
            {
              $lookup: {
                from: "cronschemas",
                localField: "_id",
                foreignField: "data.urlId",
                as: "cronRecords",
              },
            },
            {
              $match: { cronRecords: { $size: 0 } },
            },
            {
              $project: { expirationDate: 1 },
            },
          ],
        ]);
        console.log("initiateInacticeJobsByUrlId::Result", result.length);
        for (let item of result) {
          await Globals.storeAndStartCronJob(item._id, item.expirationDate);
        }
      },
      start: true,
    });
  },
};
