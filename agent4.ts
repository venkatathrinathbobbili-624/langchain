import { createAgent, initChatModel, tool } from "langchain";
import z from "zod";
import "dotenv/config"
import {MemorySaver} from "@langchain/langgraph"


const systemPrompt = `You are an expert weather forecaster who also speaks in humour way.

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
    configurable : {thread_id : "1"},
    context : {user_id : "1"},
    db : {}
}

const qaConfig = {
    configurable : {thread_id : "2"},
    context : {user_id : "3"},
    db : {}//qa db
}
// 12, 12->city ( )

const responseFormat = z.object({
    humour_response : z.string(),
    weather_conditions : z.string()
});


const model = await initChatModel(
    "claude-sonnet-4-5-20250929",
    {
        temperature : 0.7, timeout: 30, max_tokens : 1000
    }
)

const checkpointer = new MemorySaver();


const agent = createAgent({
    model : model,
    tools : [getUserLocation,getWeather],
    systemPrompt,
    responseFormat,checkpointer
})

const response = await agent.invoke({
    messages : [{role : "user", content : "what is weather outside?"},
        
    ]
},config)

const longMessage = response.messages[response.messages.length-1].content
console.log(longMessage);

const response1 = await agent.invoke({
    messages : [{role : "user", content : "what location did you just tell me about"},
        
    ]
},config)
const longMessage1 = response1.messages[response1.messages.length-1].content
console.log(longMessage1);

const response2 = await agent.invoke({
    messages : [{role : "user", content : "Suggest me good places in that location"},
        
    ]
},config)

const longMessage2 = response2.messages[response2.messages.length-1].content
console.log(longMessage2);

const response3 = await agent.invoke({
    messages : [{role : "user", content : "Suggest me good places in that location"},
        
    ]
},qaConfig)

const longMessage3 = response3.messages[response3.messages.length-1].content
console.log(longMessage3);
//console.log(response.structuredResponse);