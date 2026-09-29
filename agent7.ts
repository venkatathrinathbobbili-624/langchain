import { createAgent, llmToolSelectorMiddleware, modelFallbackMiddleware, piiRedactionMiddleware, summarizationMiddleware, tool } from "langchain";
import z from "zod";
import "dotenv/config"

//LLM ->50-70

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

//retriever tool.

//10,000 -
const agent =createAgent({
    model : "gpt-4o",
    tools : [searchTool,emailTool,getWeather],
    middleware :[
        piiRedactionMiddleware ({

            rules :{
                credit_card :/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
                ssn : /\b\d{3}-\d{2}-\d{4}\b/g,
                phone : /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
                


            }
        })


    
    ]
})

// const response = await agent.invoke({
//     messages: [{role : "user", content: "my card is 4532-1234-5678-9010"}]
// })
// console.log(response)

// const response = await agent.invoke({
//     messages: [{role : "user", content: "my ssn is 123-45-6789 and call me 555-123-4567 "}]
// })
// console.log(response)

const response = await agent.invoke({
    messages: [{role : "user", content: "my ssn is 123-45-6789 & My email is gmail provider. is this good?"}]
})
console.log(response)