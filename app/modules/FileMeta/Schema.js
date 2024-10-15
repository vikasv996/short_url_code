const mongoose = require('mongoose')
const mongoose_delete = require('mongoose-delete')
const { Schema } = mongoose;

const fileSchema = new Schema({
    urlId: { type: Schema.Types.ObjectId, ref: 'urlSchema' },
    metaData: { type: Object },
    // assetId: { type: String },
    // publicId: { type: String },
    format: { type: String },
    size: { type: Number, default: 0 }
}, {
    timestamps: true
})

fileSchema.index({ urlId: 1 })
fileSchema.index({ format: 1 })
fileSchema.index({ size: 1 })
fileSchema.plugin(mongoose_delete, { deletedAt: true, validateBeforeDelete: false, indexFields: ['deleted'], overrideMethods: true })

const FileSchema = mongoose.model('FileSchema', fileSchema);
module.exports = { FileSchema }
