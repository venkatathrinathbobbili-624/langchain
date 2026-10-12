import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ChatOpenRouter } from "@langchain/openrouter";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Embeddings } from "@langchain/core/embeddings";
import { pipeline } from "@huggingface/transformers";
import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAgent, dynamicSystemPromptMiddleware } from "langchain";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openRouterApiKey) {
  throw new Error("Set OPENROUTER_API_KEY in your .env file.");
}

const pdfPaths = [
  resolve(dirname(fileURLToPath(import.meta.url)), "../ProjectDocs/nke-10k-2023.pdf"),
  resolve(dirname(fileURLToPath(import.meta.url)), "../ProjectDocs/Nike-Inc-2025_10K.pdf"),
  resolve(dirname(fileURLToPath(import.meta.url)), "../ProjectDocs/nike-growth-story.pdf"),
];


const allDocs = [];

for(const pdfPath of pdfPaths)
{
  const loader =  new PDFLoader(pdfPath)
  const docs = await loader.load()
  allDocs.push(...docs);
}


const textSplitter = new RecursiveCharacterTextSplitter(
  { chunkSize : 1000,
    chunkOverlap : 200
  }
)

const allSplits = await textSplitter.splitDocuments(allDocs)
console.log(allSplits.length);

class LocalEmbeddings extends Embeddings {
  private readonly extractor = pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
    { dtype: "q8" },
  );

  constructor() {
    super({ maxConcurrency: 1 });
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    const extractor = await this.extractor;

    for (let i = 0; i < texts.length; i += 16) {
      const output = await this.caller.call(() =>
        extractor(texts.slice(i, i + 16), { pooling: "mean", normalize: true }),
      );
      const vectors: unknown = output.tolist();
      if (!Array.isArray(vectors) || !vectors.every(isNumberVector)) {
        throw new Error("Local embedding model returned an invalid vector.");
      }
      embeddings.push(...vectors);
    }

    return embeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    const [embedding] = await this.embedDocuments([text]);
    if (!embedding) {
      throw new Error("Local embedding model returned no query vector.");
    }
    return embedding;
  }
}

function isNumberVector(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

const embeddings = new LocalEmbeddings();

const vectorStore = new MemoryVectorStore(embeddings);
await vectorStore.addDocuments(allSplits);

 
const ragMiddleware = dynamicSystemPromptMiddleware(async (state)=>
{
  const userMessage = state.messages[0].content;
  const query = typeof userMessage === "string" ? userMessage : ""
  const retrievedDocs = await vectorStore.similaritySearch(query, 2);
  const docsContent = retrievedDocs.map((doc)=> doc.pageContent
  ).join("\n\n");

  return `You are a helpful assistant. Use the following context from the document to answer the user's question:\n\n${docsContent}`;


});



const agent = createAgent({
    model: new ChatOpenRouter({
      apiKey: openRouterApiKey,
      model: "dots-studio/dots-3-note-preview:free",
      temperature: 0,
    }),
    tools : [],
    middleware: [ragMiddleware]
  
})
const result = await agent.invoke({
 // messages : [{role: "user", content : "What was Nike revenue in 2023 & 2025 and from which town Nike has grown into world famous footwear"}]
    messages : [{role: "user", content : "As of May 31, 2023, How many shares million shares the company has purchased?"}]
})

console.log(result.messages.at(-1)?.content);




//




















