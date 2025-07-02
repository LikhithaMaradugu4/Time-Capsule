import express from 'express';
import { getContextFrom1950 } from '../utils/ragHelper.js';
import { generateChatResponse } from '../utils/llmClient.js';

const router = express.Router();

router.post('/api/chat', async (req, res) => {
    try {
        const userQuestion = req.body.question;
        const context = getContextFrom1950();
        const answer = await generateChatResponse(context, userQuestion);
        res.json({ answer });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error generating response");
    }
});

export default router;
