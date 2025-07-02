import express from 'express';
import { getContextFrom1950 } from '../utils/ragHelper.js';
import { generateChatResponse } from '../utils/llmClient.js';
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();

router.post('/api/chat', async (req, res) => {
    try {
        console.log("Chat API request received:", req.body);
        
        // Validate request body
        if (!req.body.question) {
            return res.status(400).json({ error: "Missing question in request body" });
        }

        const userQuestion = req.body.question;
        
        // Try to get context with proper error handling
        let context;
        try {
            context = getContextFrom1950();
            console.log("Context retrieved successfully");
        } catch (contextError) {
            console.error("Error getting context:", contextError);
            return res.status(500).json({ 
                error: "Error accessing historical context",
                details: contextError.message 
            });
        }
        
        // Try to generate response with proper error handling
        let answer;
        try {
            answer = await generateChatResponse(context, userQuestion);
            console.log("Response generated successfully");
        } catch (generationError) {
            console.error("Error generating response:", generationError);
            return res.status(500).json({ 
                error: "Error generating AI response",
                details: generationError.message 
            });
        }
        
        // Send successful response
        res.json({ answer });
    } catch (err) {
        console.error("Unexpected error in chat API:", err);
        res.status(500).json({ 
            error: "Internal server error", 
            details: err.message 
        });
    }
});

// Add a test endpoint to verify the router is working
router.get('/api/chat/test', (req, res) => {
    res.json({ status: "Chatbot API is working" });
});

export default router;
