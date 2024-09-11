const { createClient } = require("redis");
// const config = require("./configs");
let client = null;

module.exports = {
  createConnection: async function () {
    client = await createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    })
      .on("error", (err) => console.log("Redis Client Error", err))
      .connect();
    console.log("Redis connection established");
  },
  closeConnection: async function () {
    await client.disconnect();
    console.log("Redis connection closed");
  },

  getRedisConnection: function () {
    return client;
  },
};
