const _ = require('lodash')

const Admin = require('../modules/Admin/Schema').Admin

class Seed {
  constructor () { }

  async seedData () {
    try {
      await this.addAdmin()
    } catch (error) {
      console.log('error', error)
    }
  }

  async addAdmin () {
    try {
      const admin = await Admin.findOne({ emailId: 'admin@grr.la' })
      console.log('admin::')
      console.log(admin)
      if (_.isEmpty(admin)) {
        const data = {
          emailId: 'admin@grr.la',
          password: 'Test@123',
          name: 'Admin'
        }
        await Admin.create(data)
        console.log("Admin");
      }
      return true
    } catch (error) {
      console.log('addAdmin::error', error)
      return true
    }
  }
}

module.exports = Seed
