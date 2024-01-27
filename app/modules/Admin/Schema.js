const mongoose = require('mongoose')
const mongoose_delete = require('mongoose-delete')
const { Schema } = mongoose

const adminSchema = new Schema({
  emailId: { type: String },
  password: { type: String },
  name: { type: String }
}, {
  timestamps: true
})

adminSchema.plugin(mongoose_delete, { deletedAt: true, validateBeforeDelete: false, indexFields: ['deleted'], overrideMethods: true })

const Admin = mongoose.model('Admin', adminSchema)

module.exports = {
  Admin
}
