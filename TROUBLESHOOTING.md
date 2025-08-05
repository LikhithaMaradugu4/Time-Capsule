# Troubleshooting Guide

## The error you're seeing

```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This error means the frontend is receiving HTML instead of JSON from the server. Here's how to fix it:

## Step-by-Step Solution

### 1. Install Dependencies
```bash
cd /workspaces/Time-Capsule
npm install
```

### 2. Check Environment Variables
Make sure your `.env` file exists and contains all required variables:
```
GEMINI_API_KEY=your_key
MONGO_URI=your_mongodb_uri
AZURE_STORAGE_CONNECTION_STRING=your_azure_connection
AZURE_CONTAINER_NAME=your_container_name
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
EMAIL_SERVICE=gmail
```

### 3. Start the Server
```bash
npm start
```

You should see:
```
Server running on port 3000
Connected to MongoDB
```

### 4. Test the Server
Open a new terminal and run:
```bash
curl http://localhost:3000/api/health
```

You should get:
```json
{"success":true,"message":"Server is running","timestamp":"..."}
```

### 5. Access the Application
Open your browser and go to:
```
http://localhost:3000/time-explorer.html
```

## Common Issues

### Issue: "Cannot find module" errors
**Solution:** Run `npm install` to install dependencies

### Issue: "ENOENT: no such file or directory" for .env
**Solution:** Make sure your `.env` file exists in the project root

### Issue: MongoDB connection error
**Solution:** Check your MONGO_URI in the `.env` file

### Issue: Azure storage error
**Solution:** Verify your AZURE_STORAGE_CONNECTION_STRING and AZURE_CONTAINER_NAME

### Issue: Port already in use
**Solution:** Kill the process on port 3000 or change the port:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

## Debug Mode

For more detailed debugging, run:
```bash
NODE_ENV=development npm start
```

This will show more detailed error messages and logs.