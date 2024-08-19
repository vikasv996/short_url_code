const mongoose = require('mongoose')
const mongoose_delete = require('mongoose-delete')
const { Schema } = mongoose;

const urlSchema = new Schema({
  urlName: { type: String, required: true },
  originalUrl: { type: String, required: true },
  shortUrl: { type: String },
  adminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
  timesClicked: { type: Number, default: 0 },
  expirationDate: { type: Date },
  lastVisitedOn: { type: Date, default: null },
  isExpired: { type: Boolean, default: false }
}, {
  timestamps: true
})

urlSchema.index({ shortUrl: 1 }, { unique: true });
urlSchema.index({ isExpired: 1 });
urlSchema.index({ expirationDate: 1 });
urlSchema.index({ lastVisitedOn: 1 });
urlSchema.plugin(mongoose_delete, { deletedAt: true, validateBeforeDelete: false, indexFields: ['deleted'], overrideMethods: true })

const URLSchema = mongoose.model('UrlSchema', urlSchema)
module.exports = { URLSchema }