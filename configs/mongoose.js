const config = require('./configs')
const mongoose = require('mongoose')
mongoose.Promise = global.Promise

module.exports = {
  createConnection: async function () {
    try {
      const db = await mongoose.connect(config.db)
      console.log('MongoDB connected')
      // mongoose.set('debug', true);
    } catch (err) {
      console.log('Error while connecting to database --- ', err)
    }
  },
  closeConnection: async function () {
    mongoose.connection.close(false);
    console.log('MongoDB connection closed')
  }
}
