# Time Capsule Application

A digital time capsule application that allows users to create messages with media files to be opened in the future.

## Features

- Create time capsules with text messages
- Upload audio, video, and image files
- Store files in Azure Blob Storage
- Save capsule data in MongoDB
- Schedule capsules to open at future dates
- Responsive web interface with 3D effects

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Make sure your `.env` file contains:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   MONGO_URI=your_mongodb_connection_string
   AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
   AZURE_CONTAINER_NAME=your_container_name
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   EMAIL_SERVICE=gmail
   ```

3. **Start the Server**
   ```bash
   npm start
   ```
   or for development:
   ```bash
   npm run dev
   ```

4. **Access the Application**
   Open your browser and go to `http://localhost:3000/time-explorer.html`

## API Endpoints

- `POST /api/time-capsule` - Create a new time capsule
- `GET /api/time-capsules` - Get all time capsules

## File Upload Limits

- Maximum file size: 50MB per file
- Supported formats:
  - Audio: any audio format
  - Video: any video format  
  - Images: any image format

## Technologies Used

- Node.js & Express.js
- MongoDB with Mongoose
- Azure Blob Storage
- Multer for file uploads
- HTML5, CSS3, JavaScript (Frontend)

## Project Structure

```
/workspaces/Time-Capsule/
├── server.js              # Main server file
├── time-explorer.html     # Frontend form
├── package.json          # Dependencies
├── .env                  # Environment variables
└── README.md            # This file
```