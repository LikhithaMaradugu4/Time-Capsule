const express = require('express');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting Time Capsule Server...');
console.log('📋 Environment check:');
console.log('- MongoDB URI:', process.env.MONGO_URI ? '✓ Found' : '❌ Missing');
console.log('- Azure Storage:', process.env.AZURE_STORAGE_CONNECTION_STRING ? '✓ Found' : '❌ Missing');
console.log('- Azure Container:', process.env.AZURE_CONTAINER_NAME ? '✓ Found' : '❌ Missing');

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.')); // Serve static files from current directory

// Add CORS headers for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.method === 'POST' && req.path.includes('/api/')) {
        console.log('Request body keys:', Object.keys(req.body || {}));
        console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
    }
    next();
});

// Configure multer for file uploads (store in memory)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Azure Blob Storage setup
let containerClient;
try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME);
    console.log('✅ Azure Blob Storage configured');
} catch (error) {
    console.error('❌ Azure Blob Storage configuration failed:', error.message);
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Time Capsule Schema
const timeCapsuleSchema = new mongoose.Schema({
    message: { type: String, required: true },
    recipientType: { type: String, required: true },
    recipientEmail: { type: String },
    openDate: { type: Date, required: true },
    audioFileUrl: { type: String },
    videoFileUrl: { type: String },
    imageFileUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const TimeCapsule = mongoose.model('TimeCapsule', timeCapsuleSchema);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Time Capsule Server is running', 
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/health',
            'POST /api/time-capsule',
            'GET /api/time-capsules'
        ]
    });
});

// Helper function to upload file to Azure Blob Storage
async function uploadToAzure(file, fileName) {
    try {
        if (!containerClient) {
            throw new Error('Azure Blob Storage not configured');
        }
        
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        const uploadResponse = await blockBlobClient.upload(file.buffer, file.size, {
            blobHTTPHeaders: {
                blobContentType: file.mimetype
            }
        });
        
        console.log(`✅ File uploaded to Azure: ${fileName}`);
        return blockBlobClient.url;
    } catch (error) {
        console.error('❌ Error uploading to Azure:', error);
        throw error;
    }
}

// POST route for time capsule form submission
app.post('/api/time-capsule', upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'videoFile', maxCount: 1 },
    { name: 'imageFile', maxCount: 1 }
]), async (req, res) => {
    console.log('📨 Received time capsule submission');
    console.log('📝 Form data:', {
        message: req.body.message ? `${req.body.message.substring(0, 50)}...` : 'No message',
        recipientType: req.body.recipientType,
        recipientEmail: req.body.recipientEmail,
        openDate: `${req.body.openDay}/${req.body.openMonth}/${req.body.openYear}`,
        files: req.files ? Object.keys(req.files) : 'No files'
    });
    
    try {
        const { message, recipientType, recipientEmail, openDay, openMonth, openYear } = req.body;
        
        // Validate required fields
        if (!message || !recipientType || !openDay || !openMonth || !openYear) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: message, recipientType, and date components are required' 
            });
        }

        // Validate recipient email if sending to someone else
        if (recipientType === 'other' && !recipientEmail) {
            console.log('❌ Missing recipient email');
            return res.status(400).json({ 
                success: false, 
                message: 'Recipient email is required when sending to someone else' 
            });
        }

        // Create the open date
        const openDate = new Date(parseInt(openYear), parseInt(openMonth) - 1, parseInt(openDay));
        console.log('📅 Open date:', openDate);
        
        // Validate that the date is at least 1 hour in the future
        const oneHourFromNow = new Date(Date.now() + (60 * 60 * 1000));
        if (openDate <= oneHourFromNow) {
            console.log('❌ Invalid date - must be in future');
            return res.status(400).json({ 
                success: false, 
                message: 'Open date must be at least 1 hour in the future' 
            });
        }

        // Prepare time capsule data
        const timeCapsuleData = {
            message,
            recipientType,
            recipientEmail: recipientType === 'other' ? recipientEmail : undefined,
            openDate
        };

        // Upload files to Azure Blob Storage if they exist
        const files = req.files;
        const timestamp = Date.now();

        if (files && files.audioFile && files.audioFile[0]) {
            const audioFile = files.audioFile[0];
            const audioFileName = `audio_${timestamp}_${audioFile.originalname}`;
            timeCapsuleData.audioFileUrl = await uploadToAzure(audioFile, audioFileName);
        }

        if (files && files.videoFile && files.videoFile[0]) {
            const videoFile = files.videoFile[0];
            const videoFileName = `video_${timestamp}_${videoFile.originalname}`;
            timeCapsuleData.videoFileUrl = await uploadToAzure(videoFile, videoFileName);
        }

        if (files && files.imageFile && files.imageFile[0]) {
            const imageFile = files.imageFile[0];
            const imageFileName = `image_${timestamp}_${imageFile.originalname}`;
            timeCapsuleData.imageFileUrl = await uploadToAzure(imageFile, imageFileName);
        }

        // Save to MongoDB
        const timeCapsule = new TimeCapsule(timeCapsuleData);
        await timeCapsule.save();
        
        console.log('✅ Time capsule saved to database');

        // Return success response
        res.json({
            success: true,
            message: 'Time capsule created successfully!',
            data: {
                id: timeCapsule._id,
                openDate: openDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            }
        });

    } catch (error) {
        console.error('❌ Error creating time capsule:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error: ' + error.message 
        });
    }
});

// Route to get all time capsules (for testing)
app.get('/api/time-capsules', async (req, res) => {
    try {
        const timeCapsules = await TimeCapsule.find().sort({ createdAt: -1 });
        res.json({ success: true, data: timeCapsules });
    } catch (error) {
        console.error('Error fetching time capsules:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('🚨 Global error handler:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    console.log('❌ 404 - API endpoint not found:', req.path);
    res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🌟 Time Capsule Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}/time-explorer.html`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;