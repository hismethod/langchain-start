import path from "path";
import fs from "fs";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const translatePrompt = new ChatPromptTemplate.fromTe({
  template: `Please translate the following text from Korean to English while maintaining the MDX format and structure. Do not modify or remove any markdown syntax, special characters, or technical terms. Keep the technical terms in their original language. Here's the text to translate:
 
 {text}`,
  inputVariables: ["text"],
});

async function translateText(text, model) {
  const chain = new LLMChain({ llm: model, prompt: translatePrompt });
  const response = await chain.invoke({ text });
  return response.text;
}

function splitIntoChunks(text, maxChunkLength) {
  const lines = text.split("\n");
  const chunks = [];
  let currentChunk = "";

  for (const line of lines) {
    if (currentChunk.length + line.length + 1 <= maxChunkLength) {
      currentChunk += line + "\n";
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = line + "\n";
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

async function translateChunk(chunk, model, destinationPath) {
  const translatedChunk = await translateText(chunk, model);
  fs.appendFileSync(destinationPath, translatedChunk + "\n");
}

async function translateMDXFile(sourcePath, destinationPath, model, maxChunkLength = 3000) {
  if (fs.existsSync(destinationPath)) {
    console.log(`Skipping: ${destinationPath}`);
    return;
  }

  const mdxString = fs.readFileSync(sourcePath, "utf-8");
  const chunks = splitIntoChunks(mdxString, maxChunkLength);

  for (const chunk of chunks) {
    await translateChunk(chunk, model, destinationPath);
  }

  console.log(`Translated: ${sourcePath} -> ${destinationPath}`);
}

async function translateMDXFolder(sourceFolder, destinationFolder, model) {
  if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder, { recursive: true });
  }

  const files = fs.readdirSync(sourceFolder);
  for (const file of files) {
    const sourcePath = path.join(sourceFolder, file);
    const destinationPath = path.join(destinationFolder, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      await translateMDXFolder(sourcePath, destinationPath, model);
    } else if (path.extname(file) === ".mdx") {
      await translateMDXFile(sourcePath, destinationPath, model);
    }
  }
}

// Usage example
const sourceDir = "/Users/hismethod/Developments/langchainjs/docs/core_docs/docs_en/get_started";
const targetDir = "/Users/hismethod/Developments/langchainjs/docs/core_docs/docs/get_started";

const model = new ChatAnthropic({
  modelName: "claude-3-haiku-20240307",
  temperature: 0,
});

translateMDXFolder(sourceDir, targetDir, model)
  .then(() => {
    console.log("Translation completed.");
  })
  .catch((error) => {
    console.error("Translation error:", error);
  });
