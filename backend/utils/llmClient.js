import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define valid models
const MODELS = [
  "gemini-1.5-flash-latest", // lightweight, fast
  "gemini-1.5-pro-latest"    // more advanced, may hit quotas
];

export async function generateChatResponse(context, userQuestion, decade) {
    console.log("Called generateChatResponse with models:", MODELS);
    console.trace("Stack trace for generateChatResponse call:");

    // Make sure context is stringified
    let contextString;
    try {
        contextString = JSON.stringify(context, null, 2);
    } catch (err) {
        contextString = String(context); // fallback just in case
    }
    
    // Truncate context if very large
    const trimmedContext = contextString.length > 2000 
        ? contextString.slice(0, 2000) + "..." 
        : contextString;

    const prompt = `You are a friendly Indian person living in ${decade}, casually chatting. 
Use the following historical context to inform your responses:
${trimmedContext}

User question: ${userQuestion}

Respond in a conversational, period-appropriate way as someone from the ${decade}s India.`;

    let lastError = null;

    for (const modelName of MODELS) {
        try {
            console.log(`\nAttempting to use model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            let retries = 0;
            const maxRetries = 3;

            while (retries <= maxRetries) {
                try {
                    // Race with timeout
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Request timeout')), 30000)
                    );

                    const result = await Promise.race([
                        model.generateContent(prompt),
                        timeoutPromise
                    ]);

                    console.log(`✅ Successfully generated response using ${modelName}`);
                    return result.response.text();
                } catch (err) {
                    // Retry on rate limit
                    if (err.status === 429 && retries < maxRetries) {
                        retries++;
                        const delay = Math.pow(2, retries) * 1000;
                        console.log(`⚠️ Rate limited. Retrying in ${delay / 1000} seconds... (${retries}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        throw err;
                    }
                }
            }
        } catch (err) {
            console.error(`❌ Error with model ${modelName}:`, err.message || err);
            lastError = err;

            if (modelName === MODELS[MODELS.length - 1]) {
                console.error("🚨 All models failed. Last error:", err);
                return "I'm sorry, I'm having trouble connecting to my knowledge system right now. Please try again in a few moments.";
            } else {
                console.log(`➡️ Falling back to next available model...`);
            }
        }
    }

    // If loop exits without return, throw last error
    throw lastError || new Error("Failed to generate response with any model.");
}
