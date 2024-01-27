const config = require('./configs')
const mongoose = require('mongoose')
mongoose.Promise = global.Promise

module.exports = async function () {
  try {
    const db = await mongoose.connect(config.db)
    console.log('MongoDB connected')
    // mongoose.set('debug', true);
  } catch (err) {
    console.log('Error while connecting to database --- ', err)
  }
}
