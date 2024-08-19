const mongoose = require('mongoose')
const mongoose_delete = require('mongoose-delete')
const { Schema } = mongoose;

const cronSchema = new Schema({
  data: { urlId: { type: Schema.Types.ObjectId, ref: 'URLSchema' } },
  type: { type: String, enum: ['Repeated', 'Once'] },
  scheduledTime: Date,
  onTickfuncName: String,
  onCompFuncName: String,
  status: { type: String, enum: ['Complete', 'Incomplete'] }
}, {
  timestamps: true
})

cronSchema.index({ type: 1 });
cronSchema.index({ status: 1 });
cronSchema.plugin(mongoose_delete, { deletedAt: true, validateBeforeDelete: false, indexFields: ['deleted'], overrideMethods: true })

const CronSchema = mongoose.model('CronSchema', cronSchema)
module.exports = { CronSchema };
