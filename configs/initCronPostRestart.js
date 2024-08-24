const { CronSchema } = require("../app/modules/CronJob/Schema");
const { cronJobToExpireUrlsBySingle, cronJobToPurgeUploadedFiles } = require('./cronScheduler')
// initCronPostRestart
module.exports = {
    startIncompleteJobs: async () => {

        let fetchIncompleteJobs = await CronSchema.find({ type: "Once", status: "Incomplete" }, 'data scheduledTime').lean();
        console.log("fetchIncompleteJobs");
        console.log(fetchIncompleteJobs);
        if (!fetchIncompleteJobs.length) {
            console.log("All the cron jobs are in complete state.");
            return;
        }
        for (let job of fetchIncompleteJobs) {
            let {_id, scheduledTime, data: { urlId }} = job;
            console.log("Executing incomplete jobs...");
            cronJobToExpireUrlsBySingle(_id, urlId, scheduledTime);
        }
    },

    jobToPurgeUploadedFiles: async () => {
        cronJobToPurgeUploadedFiles();
    }
}
