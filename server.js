import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import chatbotRoutes from './backend/routes/chatbot.js'
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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

// Handle 404s
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Time Capsule server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the Time Capsule`);
});
