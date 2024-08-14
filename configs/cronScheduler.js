const { CronJob } = require("cron");
const moment = require("moment");
const { URLSchema } = require("../app/modules/UrlCrud/Schema");

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
  
  cronJobToExpireUrlsBySingle: async (_id, expirationDate) => {
    CronJob.from({
        cronTime: moment(expirationDate).toDate(),
        onTick: async () => {
            await URLSchema.findByIdAndUpdate(_id, { isExpired: true });
        },
        start: true
    })
  }

};
