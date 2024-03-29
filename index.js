import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
});

const response = await model.invoke("대한민국 국기에 해당하는 이모지는 뭐야?");

console.log(response);
