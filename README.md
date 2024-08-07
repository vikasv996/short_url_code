# URL Shortener

A simple Node.js application for shortening URLs. This application provides APIs to create, list, delete, and redirect shortened URLs.

## Features

- **Shorten URLs:** Generate a short URL from a provided original URL.
- **List URLs:** List all shortened URLs with pagination and lazy loading.
- **Delete URLs:** Soft delete a shortened URL.
- **Redirect URLs:** Redirect to the original URL using the short URL and increment the access count.

## API Endpoints

### 1. Insert URL

- **Endpoint:** `POST /insert-url`
- **Description:** Generate a short URL and store it in the database.
- **Request Body:**
  ```json
  {
    "originalUrl": "string", // The URL that needs to be shortened.
    "urlName": "string" // A label or short description of the URL
  }
  ```

### 2. List URLs

- **Endpoint:** `GET /list-url`
- **Description**: List all the shortened URLs with pagination and lazy loading.

### 3. Delete URL

- **Endpoint:** `DELETE /:custom-url`
- **Description**: Soft delete the short URL from the database.
- **Parameters**:
    - `custom-url` : The short URL that needs to be deleted.

### 4. Redirect URL

- **Endpoint:** `GET /red/:custom-url`
- **Description**: Redirect to the original URL based on the provided short URL and increment the access count.
- **Parameters**:
    - `custom-url` : The short URL used for redirection.

## Getting Started

### Prerequisites

- Nodejs
- npm

### Installation

1. Clone the repository: 
```sh
git clone https://github.com/vikasv996/short_url_code.git
```
2.Navigate to the project directory:
```sh
cd short_url_code
```
3. Install dependencies:
```sh
npm install
```

### Running the application

1. Start the application:
```sh
npm run dev
```
2. The application will run on `http://localhost:4000`
3. You can also use this url https://short-url-code.onrender.com to access the endpoints.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.
