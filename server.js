import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import chatbotRoutes from './backend/routes/chatbot.js'
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob';

dotenv.config();
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("MongoDB connection error:", err));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.')); // Serve static files from current directory

// Configure multer for file uploads (store in memory)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Azure Blob Storage setup
const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

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

// Helper function to upload file to Azure Blob Storage
async function uploadToAzure(file, fileName) {
    try {
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        const uploadResponse = await blockBlobClient.upload(file.buffer, file.size);
        
        // Return the URL of the uploaded file
        return blockBlobClient.url;
    } catch (error) {
        console.error('Error uploading to Azure:', error);
        throw error;
    }
}

// Mount chatbot routes with explicit logging
console.log("Mounting chatbot routes...");
app.use('/', chatbotRoutes);
console.log("Chatbot routes mounted successfully");

// API endpoint to get year data
app.get('/api/year', async (req, res) => {
    const year = parseInt(req.query.year);
    
    // Validate year
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 10) {
        return res.status(400).json({
            error: 'Invalid year. Please provide a year between 1900 and the near future.'
        });
    }

    try {
        // Determine decade based on the year
        const decade = Math.floor(year / 10) * 10;
        
        // Check if the decade template exists
        const templateFile = `${decade}.html`;
        const templatePath = path.join(__dirname, 'decades', templateFile);
        
        let templateExists = false;
        try {
            await fs.access(templatePath);
            templateExists = true;
        } catch (err) {
            // Template doesn't exist
            templateExists = false;
        }

        // Generate response data
        const response = {
            year,
            decade,
            template: templateExists ? templateFile : 'default.html',
            events: getEventsForYear(year),
            topSong: getTopSongForYear(year),
            fashionImage: getFashionImageForDecade(decade)
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error processing year request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper functions to generate sample data
function getEventsForYear(year) {
    // This would typically come from a database
    // For demo purposes, we'll just generate some placeholder events
    return [
        `${year}: Major political event happened`,
        `${year}: Popular cultural milestone occurred`,
        `${year}: Significant technological advancement`,
        `${year}: Notable world event took place`
    ];
}

function getTopSongForYear(year) {
    // Placeholder data - in a real app, this would come from a database
    const songsByDecade = {
        1950: 'Rock Around the Clock',
        1960: 'I Want to Hold Your Hand',
        1970: 'Stayin\' Alive',
        1980: 'Billie Jean',
        1990: 'Smells Like Teen Spirit',
        2000: 'Beautiful Day',
        2010: 'Rolling in the Deep',
        2020: 'Blinding Lights'
    };
    
    const decade = Math.floor(year / 10) * 10;
    return songsByDecade[decade] || 'Unknown';
}

function getFashionImageForDecade(decade) {
    // In a real app, you would have specific images for each decade
    return `/images/fashion-${decade}.jpg`;
}

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle time-explorer with template parameter
app.get('/time-explorer.html', async (req, res) => {
  const { template, year } = req.query;
  
  console.log(`Accessing time-explorer with params: year=${year}, template=${template}`);
  
  if (template) {
    try {
      // Check if the template file exists in the decades directory
      const templatePath = path.join(__dirname, 'decades', template);
      console.log(`Looking for template at: ${templatePath}`);
      
      // Check if file exists before trying to serve it
      await fs.access(templatePath);
      console.log(`Template file found, serving: ${templatePath}`);
      
      // If the template exists, serve it directly
      return res.sendFile(templatePath);
    } catch (err) {
      console.error(`Error serving template '${template}': ${err.message}`);
      // If template doesn't exist, fall back to default time-explorer.html
    }
  }
  
  console.log('Falling back to default time-explorer.html');
  // Default behavior - serve the regular time-explorer.html
  res.sendFile(path.join(__dirname, 'time-explorer.html'));
});

// Make the decades directory accessible as static files
// This ensures that relative paths like "../assets/images/..." work correctly
app.use('/decades', express.static(path.join(__dirname, 'decades')));

// Also ensure assets directory is properly accessible
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Create a specific route to serve decade templates directly
app.get('/decades/:template', async (req, res) => {
  const templatePath = path.join(__dirname, 'decades', req.params.template);
  
  try {
    await fs.access(templatePath);
    res.sendFile(templatePath);
  } catch (err) {
    res.status(404).send(`Template '${req.params.template}' not found`);
  }
});

// POST route for time capsule form submission
app.post('/api/time-capsule', upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'videoFile', maxCount: 1 },
    { name: 'imageFile', maxCount: 1 }
]), async (req, res) => {
    try {
        const { message, recipientType, recipientEmail, openDay, openMonth, openYear } = req.body;
        
        // Validate required fields
        if (!message || !recipientType || !openDay || !openMonth || !openYear) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Validate recipient email if sending to someone else
        if (recipientType === 'other' && !recipientEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Recipient email is required when sending to someone else' 
            });
        }

        // Create the open date
        const openDate = new Date(parseInt(openYear), parseInt(openMonth) - 1, parseInt(openDay));
        
        // Validate that the date is at least 1 hour in the future
        const oneHourFromNow = new Date(Date.now() + (60 * 60 * 1000));
        if (openDate <= oneHourFromNow) {
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

        if (files.audioFile && files.audioFile[0]) {
            const audioFile = files.audioFile[0];
            const audioFileName = `audio_${timestamp}_${audioFile.originalname}`;
            timeCapsuleData.audioFileUrl = await uploadToAzure(audioFile, audioFileName);
        }

        if (files.videoFile && files.videoFile[0]) {
            const videoFile = files.videoFile[0];
            const videoFileName = `video_${timestamp}_${videoFile.originalname}`;
            timeCapsuleData.videoFileUrl = await uploadToAzure(videoFile, videoFileName);
        }

        if (files.imageFile && files.imageFile[0]) {
            const imageFile = files.imageFile[0];
            const imageFileName = `image_${timestamp}_${imageFile.originalname}`;
            timeCapsuleData.imageFileUrl = await uploadToAzure(imageFile, imageFileName);
        }

        // Save to MongoDB
        const timeCapsule = new TimeCapsule(timeCapsuleData);
        await timeCapsule.save();

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
        console.error('Error creating time capsule:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
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

// Handle 404s
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Time Capsule server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the Time Capsule`);
});
