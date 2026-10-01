import { createAgent, tool } from "langchain";
import "dotenv/config";
import * as z from "zod";


import { ChatOpenRouter } from "@langchain/openrouter";


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


const openRouterModel = new ChatOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "openai/gpt-4o-mini", // Pass any model identifier here
  temperature: 0,
});


const agent = createAgent({
  model: openRouterModel,
  tools: [getWeather, getTime],
});

async function start() {
  console.log("Sending query to OpenRouter data centers...");
  
  const response = await agent.invoke({
    messages: [{ role: "user", content: "What is the weather in New York?" }]
  });
  
  const lastMessage = response.messages[response.messages.length - 1];
  console.log("\n--- Response ---");
  console.log(lastMessage.content);
}

start().catch((err) => {
  console.error("Agent Execution Failed:", err);
});
