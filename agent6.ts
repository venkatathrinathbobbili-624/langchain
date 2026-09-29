import { createAgent, llmToolSelectorMiddleware, modelFallbackMiddleware, summarizationMiddleware, tool } from "langchain";
import z from "zod";
import "dotenv/config"



const searchTool = tool(({ query }) => {
    return `Search results for "${query}" : Found 5 articles are returned`
},
    {
        name: "search",
        description: "Search the internet for information",
        schema: z.object({
            query: z.string()
        })
    })

const emailTool = tool(({recipient,subject}) => {
    `Email sent to ${recipient} with subject ${subject}`
}, {
    name: "send_email",
    description: "send an email to some one",
    schema: z.object({
        recipient: z.string(),
        subject: z.string()
    })
})

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


//10,000 -
const agent =createAgent({
    model : "gpt-4o",
    tools : [searchTool,emailTool,getWeather],
    middleware :[
        //50 tools -  basic model - 3-4 tools - Main model( reasoning) -> output
        // This middleware should run FIRST to select tools using gpt-4o-mini
        
        modelFallbackMiddleware("gpt-4o-mini","gpt-3.5-turbo"),
        summarizationMiddleware({
            model : "gpt-4o",
            maxTokensBeforeSummary :8000, //Trigger summarization of 8000 tokens
            messagesToKeep :20
        }),
        llmToolSelectorMiddleware({
            model : "gpt-4o-mini",
            maxTools : 2
        }),
    ]
})

const response = await agent.invoke({
    messages: [{role : "user", content: "what is the weather in tokyo and email to rahulshetty@gmail.com with subject weather"}]
})
console.log(response)