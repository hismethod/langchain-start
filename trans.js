import { compile } from "@mdx-js/mdx";
import { visit } from "unist-util-visit";
import fs from "fs-extra";
import path from "path";
import { ChatAnthropic } from "@langchain/anthropic";

const model = new ChatAnthropic({
  modelName: "claude-3-haiku-20240307",
  temperature: 0,
});

const sourceDir = "/Users/hismethod/Developments/langchainjs/docs/core_docs/docs_en/get_started";
const targetDir = "/Users/hismethod/Developments/langchainjs/docs/core_docs/docs/get_started";
/**
 * Translates the text content of an MDX string using the provided translation function.
 *
 * @param {string} mdxContent - The MDX-formatted text string to be translated.
 * @param {Function} translateFn - An asynchronous function that takes a string as input and returns the translated string.
 * @returns {Promise<string>} - A promise that resolves to the translated MDX string.
 */
async function translateMdxContent(mdxContent, translateFn) {
  try {
    const compiled = await compile(mdxContent);
    const ast = compiled.tree;

    // Collect all text nodes that need to be translated
    const textNodes = [];
    visit(ast, "text", (node) => {
      textNodes.push(node);
    });

    // Translate the text content of each node
    const translationPromises = textNodes.map(async (node) => {
      const translatedText = await translateFn(node.value);
      node.value = translatedText;
    });

    // Wait for all translations to complete
    await Promise.all(translationPromises);

    // Reconstruct the translated MDX string
    const translatedMdxContent = compiled.contents;

    return translatedMdxContent;
  } catch (error) {
    console.error("Error translating MDX content:", error);
    throw error;
  }
}

async function translateMdxFile(sourcePath, targetPath, translateFn) {
  try {
    // 이미 번역된 파일이 있는지 확인
    if (await fs.pathExists(targetPath)) {
      console.log(`이미 번역된 파일: ${targetPath}`);
      return;
    }

    // const mdxContent = await fs.readFile(sourcePath, "utf-8");
    const translatedMdxContent = await translateMdxContent(sourcePath, translateFn);
    await fs.outputFile(targetPath, translatedMdxContent);
    console.log(`번역 완료: ${sourcePath} -> ${targetPath}`);
  } catch (error) {
    console.error(`번역 실패: ${sourcePath}`, error);
  }
}

async function translateDirectory(sourceDir, targetDir, translateFn) {
  try {
    await fs.ensureDir(targetDir);
    const files = await fs.readdir(sourceDir);

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      const stats = await fs.stat(sourcePath);

      if (stats.isDirectory()) {
        await translateDirectory(sourcePath, targetPath, translateFn);
      } else if (stats.isFile() && file.endsWith(".mdx")) {
        await translateMdxFile(sourcePath, targetPath, translateFn);
      }
    }
  } catch (error) {
    console.error("디렉토리 번역 실패:", error);
  }
}

async function main() {
  const translateFn = async (text) => {
    const res = await model.invoke(`Translate the following English text to Korean
    \n- Do not translate metadata properties, technical terms, code snippets, or proper nouns.
    \n- Do not modify the original text or add any content beyond the translation.
    \n- Preserve the original formatting and infer meaning from context if needed.
    \n\n${text}`);
    return res.content;
  };

  await translateDirectory(sourceDir, targetDir, translateFn);
  console.log("번역이 완료되었습니다.");
}

main().catch((error) => {
  console.error("번역 프로세스 실패:", error);
});
