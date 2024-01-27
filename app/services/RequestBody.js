class RequestBody {
  checkEmptyWithFields (body, fieldsArray) {
    return new Promise(async (resolve, reject) => {
      try {
        const requiredFields = []
        fieldsArray.forEach(element => {
          if (!(element in body) || body[element] === '' || typeof body[element] === 'undefined') {
            requiredFields.push(element)
          }
        })
        resolve(requiredFields)
      } catch (error) {
        reject(error)
      }
    })
  }
}

module.exports = RequestBody
