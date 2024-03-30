import { ChatAnthropic } from "@langchain/anthropic";

const model = new ChatAnthropic({
  modelName: "claude-3-haiku-20240307",
});

const response = await model.invoke("대한민국 국기에 해당하는 이모지는 뭐야?");

console.log(response);
