const nodemailer = require('nodemailer')
const config = require('../../configs/configs')

const bulkHtmlTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Short URLs Generated</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding: 10px 0;
        background-color: #007bff;
        color: #ffffff;
        border-radius: 8px 8px 0 0;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        padding: 20px;
      }
      .content p {
        font-size: 16px;
        color: #333333;
      }
      .url-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      .url-table th,
      .url-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      .url-table th {
        background-color: #007bff;
        color: white;
      }
      .url-table td a {
        color: #007bff;
        text-decoration: none;
        word-wrap: break-word;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        padding: 10px;
        font-size: 12px;
        color: #777777;
      }
      @media only screen and (max-width: 600px) {
        .container {
          width: 100%;
          padding: 10px;
        }
        .content p {
          font-size: 14px;
        }
        .header h1 {
          font-size: 20px;
        }
        .url-table th, .url-table td {
          font-size: 12px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Short URLs Generated</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>Your file has been processed, and the following short URLs have been generated:</p>
        <table class="url-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Short URL</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <!-- Dynamically Insert URL Data Here -->
            {{#each urlArray}}
                <tr>
                    <td>{{this.srNo}}</td>
                    <td><a href="{{this.shortUrl}}">{{this.shortUrl}}</a></td>
                    <td>{{this.urlName}}</td>
                </tr>
            {{/each}}
          </tbody>
        </table>
        <p>Thank you for using our service!</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 ShortUrl Service | All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`

const expiredUrlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>URL Expired Page</title>
  <style>
    /* Reset basic margin/padding */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* Ensure the container takes full height and width of viewport */
    body, html {
      height: 100%;
      font-family: Arial, sans-serif;
    }

    /* Main container styling */
    .container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      background-image: url('/expired_url_illustration.svg');
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
    }

    /* Overlay to darken the background image */
    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
    }

    /* Text content styling */
    .content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: rgba(0, 0, 0, 0.7);
      padding: 20px;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    p {
      font-size: 1.25rem;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      h1 {
        font-size: 2rem;
      }

      p {
        font-size: 1rem;
      }
    }

    @media (max-width: 480px) {
      h1 {
        font-size: 1.5rem;
      }

      p {
        font-size: 0.875rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="overlay"></div>
    <div class="content">
      <h2>Oops! This URL has expired.</h2>
      <p>The link you are trying to access is no longer available.</p>
    </div>
  </div>
</body>
</html>
`

const emailTransporter = nodemailer.createTransport({
  service: 'Gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: config.TRANSPORTER_EMAIL,
    pass: config.EMAIL_PASSWORD
  }
})

let hashMap = null
const initHashMap = function () {
  if (hashMap === null) {
    hashMap = new Map()
  }
}

const setValueMap = function (key, value) {
  hashMap.set(key, value)
}

const getValueMap = function (key) {
  return hashMap.get(key)
}

const printMap = function () {
  return hashMap
}

const MAXIMUM_FILE_SIZE_IN_BYTES = 5 * 1000000 // 5MB

module.exports = {
  MAXIMUM_FILE_SIZE_IN_BYTES,
  bulkHtmlTemplate,
  expiredUrlTemplate,
  emailTransporter,
  initHashMap,
  setValueMap,
  getValueMap,
  printMap
}
