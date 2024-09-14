const multer = require("multer");
const moment = require('moment');
const path  = require('path');
const configs = require('../../configs/configs')
const exportLib = require('../../lib/Exports');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({ 
  cloud_name: configs.CLOUDINARY_CLOUD_NAME, 
  api_key: configs.CLOUDINARY_API_KEY, 
  api_secret: configs.CLOUDINARY_API_SECRET
});

function checkMimetype(str) {
  const mimeTypes = {
    "text/html": ".html",
    "text/css": ".css",
    "text/javascript": ".js",
    "text/plain": ".txt",
    "text/xml": ".xml",
    "text/csv": ".csv",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "image/x-icon": ".ico",
    "application/json": ".json",
    "application/ld+json": ".jsonld",
    "application/xml": ".xml",
    "application/pdf": ".pdf",
    "application/zip": ".zip",
    "application/x-rar-compressed": ".rar",
    "application/x-www-form-urlencoded": ".form",
    "application/x-msdownload": ".exe",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/webm": ".weba",
    "video/mp4": ".mp4",
    "video/x-msvideo": ".avi",
    "video/mpeg": ".mpeg",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
    "font/woff": ".woff",
    "font/woff2": ".woff2",
    "font/ttf": ".ttf",
    "font/otf": ".otf",
    "multipart/form-data": ".multipart",
    "application/octet-stream": ".bin"
  };

  return mimeTypes[str] ? mimeTypes[str] : '';
  
}

function setMulterStorage(destPath = 'public') {
  destPath = path.join(global.rootPath, destPath)
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, destPath);
    },
    filename: function (req, file, cb) {
      console.log("File", file);
      let uniqueFileName = `File-${moment().format('YYYYMMDDHHmmss')}.${file.mimetype.split('/')[1]}`;
      let extension = checkMimetype(file.mimetype);
      if (extension) {
        uniqueFileName = "File-" + moment().format('YYYYMMDDHHmmss') + extension;
      }
      cb(null, uniqueFileName);
    },
  });
  return storage;
}

module.exports = {
  uploadSingleFile: (name = 'file') => {
    return (req, res, next) => {
      const storage = setMulterStorage();
      const upload = multer({
        storage: storage,
        // fileFilter: (req, file, cb) => {
        //   if (file.mimetype.includes("mp4")) {
        //     exportLib.Error.handleError(this.res, {
        //       code: 'INTERNAL_SERVER_ERROR',
        //       message: exportLib.ResponseEn.ERROR_UPDATING_URL
        //     })
        //     return cb(new Error('Video files not supported'))
        //   }
        //   cb(null, true);
        // },
      }).single(name);

      upload(req, res, (err) => {
        if (err) {
          console.log("multer error");
          console.log(err);
        }
        next();
      });
    }
  },

  uploadCsv: (name = 'file') => {
    return (req, res, next) => {
      const storage = setMulterStorage('bulkCsvs');
      const upload = multer({
        storage,
        fileFilter: (req, file, cb) => {
          if (!file.mimetype.includes("text/csv")) {
            return cb(new Error('Only CSV files are supported'))
          }
          cb(null, true);
        },
      }).single(name)

      upload(req, res, (err) => {
        if (err) {
          console.log("multer error");
          console.log(err);
          return exportLib.Error.handleError(res, {
            code: 'BAD_REQUEST',
            message: err.message
          })
        }
        next();
      });
    }
  },

  uploadToCloudinary: async (file) => {
    let { filename } = file;
    const uploadDir = path.join(global.rootPath, 'public', filename);
    console.log("uploadDir");
    console.log(uploadDir);
    let result;
    try {
      result = await cloudinary.uploader.upload(uploadDir, 
      { 
        asset_folder: 'ShortUrl',
        public_id: filename.split('.')[0],
        use_asset_folder_as_public_id_prefix: true
      });
      console.log("Cloudinary result:");
      console.log(result);
      return result;
    } catch (err) {
      console.log("Cloudinary error:");
      console.log(err);
      return err;
    }
  }
};
