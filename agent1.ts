// 1. Explicitly turn off LangSmith tracking BEFORE any other imports to stop the 403 error
process.env.LANGCHAIN_TRACING_V2 = "false";

import { createAgent, tool } from "langchain";
import "dotenv/config";
import * as z from "zod";
import { ChatOpenAI } from "@langchain/openai";

// --- Your original tools remain unchanged ---
const getWeather = tool((input) => {
  return `Its sunny in ${input.city}`;
}, {
  name: "get_weather",
  description: "Get the weather for a given city",
  schema: z.object({ city: z.string() })
});

const getTime = tool((input) => {
  return `The current time in ${input.city} is 3:00PM`;
}, {
  name: "get_time",
  description: "Get current time for a given city",
  schema: z.object({ city: z.string() })
});

// --- Bulletproof OpenRouter configuration ---
const openRouterModel = new ChatOpenAI({
  // Provide the key directly at the top level
  openAIApiKey: process.env.OPENROUTER_API_KEY,
  modelName: "anthropic/claude-3.5-sonnet", 
  temperature: 0,
  configuration: {
    baseURL: "https://openrouter.ai",
    // Keep it here too for the underlying OpenAI module contract
    apiKey: process.env.OPENROUTER_API_KEY, 
  },
});

const agent = createAgent({
  model: openRouterModel,
  tools: [getWeather, getTime],
});

async function start() {
  console.log("Sending prompt to OpenRouter...");
  
  const response = await agent.invoke({
    messages: [{ role: "user", content: "What is the weather in New York?" }]
  });
  
  // Safely grab and print the assistant text
  const lastMessage = response.messages[response.messages.length - 1];
  console.log("\n--- Response ---");
  console.log(lastMessage.content);
}

start().catch((err) => {
  console.error("Agent Execution Failed:", err);
});
