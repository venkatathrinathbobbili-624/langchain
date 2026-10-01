import { createAgent, tool } from "langchain";
import z from "zod";
import "dotenv/config"
import { ChatOpenRouter } from "@langchain/openrouter";


const systemPrompt = `You are an expert weather forecaster.

You have access to two tools:

- get_weather_for_location: use this to get the weather for a specific location
- get_user_location: use this to get the user's location

If a user asks you for the weather, make sure you know the location first. If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location.`;


const getUserLocation = tool((_,config)=> {

   const user_id =  config.context.user_id;
   //fire datbase query to get location based on user_id/API
   return user_id === "1" ? "Florida" : "SFO";

},
{
    name : "get_user_location",
    description : "Retrieve user information based on User Id",
    schema : z.object({})


}

);


const getWeather = tool( (input)=> {
    //${input.city} -by getting weather  - returned Sunny
    return `Its  sunny in ${input.city} `
    } ,
    {
        name : "get_weather",
        description : "Get the weather for a given city",
        schema : z.object({
            city : z.string()
            
        })
    }
);



const config = {
    context : {user_id : "1"},
    db : {}
}

const qaConfig = {
    context : {user_id : "3"},
    db : {}//qa db
}
// 12, 12->city ( )

const openRouterModel = new ChatOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "openai/gpt-4o-mini", // Pass any model identifier here
  temperature: 0,
});

const agent = createAgent({
    model : openRouterModel,
    tools : [getUserLocation,getWeather],
    systemPrompt
})

async function start() {
  console.log("Sending query to OpenRouter data centers...");
  
  const response = await agent.invoke({
    messages: [{ role: "user", content: "What is the weather in New York?" }]
  },qaConfig);
  
  const lastMessage = response.messages[response.messages.length - 1];
  console.log("\n--- Response ---");
  console.log(lastMessage.content);
}

start().catch((err) => {
  console.error("Agent Execution Failed:", err);
});