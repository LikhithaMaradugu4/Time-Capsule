import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();


// Initialize the API with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the generative model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

export async function generateChatResponse(context, userQuestion) {
    const prompt = `You are living in 1950 in India. Based on this:\n${context}\n\nQuestion: ${userQuestion}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}

