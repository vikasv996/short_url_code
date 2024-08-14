const Joi = require('joi');
const exportLib = require('../../../lib/Exports')
const urlValidationRegex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?/i

module.exports = (req, res, next) => {
    const schema = Joi.object({
        urlName: Joi.string().min(1).required(),
        originalUrl: Joi.string().pattern(urlValidationRegex).required(),
        shortUrl: Joi.string(),
        expirationDate: Joi.date().greater('now')
    });
    
    const { error, value} = schema.validate(req.body);
    if (error) {
        console.log("Joi error:");
        // console.log(error);

        let errorToThrow = [];
        error.details.map((errObj) => {
            console.log("errObj");
            console.log(errObj);
            let obj = {};
            obj["key"] = errObj.context.key;
            if (errObj.type === 'any.required') {
                obj["message"] = errObj.message;
            }
            if (errObj.type === 'string.pattern.base') {
                obj["message"] = `Invalid pattern, please check and try again.`
            }

            if (errObj.type === 'string.empty') {
                obj["message"] = errObj.message;
            }
            errorToThrow.push(obj);
        })
        
        return exportLib.Error.handleError(res, {
            code: 'BAD_REQUEST',
            message: 'Something went wrong',
            error: errorToThrow
          })
    }
    next();
}
