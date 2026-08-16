import OpenAI from 'openai';
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export default client;
