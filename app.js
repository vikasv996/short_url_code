require('custom-env').env('development')
const express = require('express')
const app = express()
const { PORT } = process.env
const customUrls = {
  'old-url-1': 'https://www.google.com/',
  'old-url-2': 'https://www.linkedin.com/'
  // Add more custom URLs as needed
}

app.get('/:customUrl', (req, res) => {
  console.log('request')
  console.log(req.path)
  console.log(req.url)
  console.log(req.params)

  const { customUrl } = req.params

  if (customUrls[customUrl]) {
    // Redirect to the custom URL
    return res.redirect(301, customUrls[customUrl])
  }
  return res.status(404).send('URL Not Found')
})

app.get('/', (req, res) => {
  res.send('Hello, this is the main page.')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
