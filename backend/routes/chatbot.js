import express from 'express';
import { getContextFromDecade } from '../utils/ragHelper.js';
import { generateChatResponse } from '../utils/llmClient.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.post('/api/chat', async (req, res) => {
    try {
        console.log("Chat API request received:", req.body);

        const userQuestion = req.body.question;
        const decade = req.body.decade || 1950;

        if (!userQuestion) {
            return res.status(400).json({ error: "Missing question in request body" });
        }

        let context;
        try {
            context = getContextFromDecade(decade);
            console.log("Context retrieved successfully");
        } catch (contextError) {
            console.error("Error getting context:", contextError);
            return res.status(500).json({ 
                error: "Error accessing historical context",
                details: contextError.message 
            });
        }
        // Always stringify to ensure LLM-readable
        const safeContext = JSON.stringify(context, null, 2);
        console.log("Prepared context for prompt:\n", safeContext);

        
        let answer;
        try {
            answer = await generateChatResponse(safeContext, userQuestion, decade);
            console.log("Response generated successfully");
        } catch (generationError) {
            console.error("Error generating response:", generationError);
            return res.status(500).json({ 
                error: "Error generating AI response",
                details: generationError.message 
            });
        }

        res.json({ answer });

    } catch (err) {
        console.error("Unexpected error in chat API:", err);
        res.status(500).json({ 
            error: "Internal server error", 
            details: err.message 
        });
    }
});

// Simple health check
router.get('/api/chat/test', (req, res) => {
    res.json({ status: "Chatbot API is working" });
});

export default router;

