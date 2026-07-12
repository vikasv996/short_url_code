# URL Shortener

A simple Node.js application for shortening URLs. This application provides APIs to create, list, delete, and redirect shortened URLs.

## Features
- **Shorten URLs**: Generate short URLs from original URLs with optional metadata like `urlName` and `expirationDate`.
- **List URLs**: Display all shortened URLs with pagination, lazy loading, and filtering options (e.g., `isExpired`, `expireIn`).
- **Delete URLs**: Soft delete functionality for shortened URLs, allowing logical deletion without data loss.
- **Redirect URLs**: Redirect users to the original URL via the short URL, while incrementing the access count. Show an error page if the URL has expired.
- **File Uploads**: Upload any file and generate a short URL linking to it.
- **Bulk URL Creation**: Upload a CSV file (max 10 entries) to create multiple short URLs.
- **Update URL Metadata**: Modify existing short URL metadata like `expirationDate` or `urlName`.

## API Endpoints

### 1. Insert URL with Expiration Date

- **Endpoint:** `POST /insert-url`
- **Description:** This endpoint now accepts an `expirationDate`, allowing users to specify when the URL should expire.

#### Example Request:
```json
{
  "originalUrl": "https://example.com",
  "urlName": "Example",
  "expirationDate": "2024-12-31T23:59:59"
}
```
#### Example Response:
```json
{
  "shortUrl": "http://localhost:4000/red/d7dzz53m"
}
```

### 2. List URLs with Filters
- The `/list-urls` endpoint now supports the following filters:
  - `isExpired`: A boolean flag that returns either expired or active URLs.
  - `expireIn`: A time filter for URLs expiring soon. Values:
    - `"1m"`: Expiring in 1 minute
    - `"1h"`: Expiring in 1 hour
    - `"1d"`: Expiring in 1 day
    - `"1M"`: Expiring in 1 month

#### Example Request:
```json
{
  "filters": {"isExpired": false}
}
```
OR
```json
{
  "filters": {"expireIn": "1h"}
}
```

### 3. Upload Any File

- **Endpoint:** `POST /upload-file`
- **Description:** Allows a user to upload any file (e.g., PDF, images), and a short URL is generated based on the file.

#### Example Request:
- Form data with a file attachment

#### Example Response
```json
{
  "shortUrl": "http://localhost:4000/red/d7dzz53m"
}
```

### 4. Redirect URL

- **Endpoint:** `GET /red/:custom-url`
- **Description**: Redirect to the original URL based on the provided short URL and increment the access count.
- **Parameters**:
    - `custom-url` : The short URL used for redirection.

 
### 5. Bulk Create Short URLs

- **Endpoint:** `POST /buk-create`
- **Description:** Allows the user to upload a CSV file containing URLs, names, and expiration dates. The system will generate short URLs for each URL in the file (max limit: 100).
- Sample CSV format
  - Column 1: `originalUrl`
  - Column 2: `urlName`
  - Column 3: `expirationDate`
 
#### Example Response:
```json
{
  "message": "Short URLs generated successfully",
  "shortUrls": [
    {"originalUrl": "https://example.com", "shortUrl": "http://localhost:4000/red/d7dzz53m"}
  ]
}
```

### 6. Update URL Metadata

- **Endpoint:** `PUT /update-url`
- **Description:** Allows updating metadata for an existing URL. You can update `expirationDate` or `urlName`.

#### Example Request:
```json
{
  "urlId": "abc123",
  "expirationDate": "2024-12-31T23:59:59",
  "urlName": "Updated URL Name"
}
```

#### Example Response:
```json
{
  "message": "URL updated successfully"
}
```

### 7. Delete URL

- **Endpoint:** `DELETE /url/:urlId`
- **Description:** Allows the deletion of a URL based on its `urlId`.

#### Example Request:
```sh
DELETE /url/abc123
```

#### Example Response:
```json
{
  "message": "URL deleted successfully"
}
```

## Getting Started

### Prerequisites

- Nodejs
- npm
- Docker

### Installation

1. Clone the repository: 
```sh
git clone https://github.com/vikasv996/short_url_code.git
```
2. Navigate to the project directory:
```sh
cd short_url_code
```
3. Run Docker compose cmd:
```sh
docker-compose up -d --build
```

### Running the application

1. The application will run on `http://localhost:4000`

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.
