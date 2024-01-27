const Schema = require('mongoose').Schema
const mongoose = require('mongoose')

const authSchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
  token: { type: String }
}, {
  timestamps: true
})

const AuthTokens = mongoose.model('AuthTokens', authSchema)

module.exports = {
  AuthTokens
}
