const dotenv = require('dotenv');
const result = dotenv.config();
// require('custom-env').env('development')
// // require('custom-env').env('production')

// const ENV_VARIABLES = process.env

// console.log('ENV_VARIABLES', ENV_VARIABLES.db)

if (result.error) {
  console.log(result.error);
  throw result.error;
}

const { parsed: envs } = result;
// console.log(envs);
module.exports = envs;
