import OpenAI from "openai";
import { ChatMessage, LLModel } from "../constants";

export const chatFns = async (
  traceTag: string,
  sessionId: string,
  convo: ChatMessage[],
  funcs: any,
  extraParams = {}
) => {
  const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
  const requestParams = {
    model: "llama-3.1-8b-instant",
    messages: convo,
    functions: funcs,
    temperature: 0,
    ...extraParams,
  };
  try {
    const response = await openai.chat.completions.create(requestParams);
    console.log("LLM Raw Response:", JSON.stringify(response, null, 2));

    const message = response.choices[0].message;
    if (!message) {
      throw new Error("No message in response");
    }

    if (funcs && !message.function_call) {
      const content = message.content;
      console.log("LLM Response without function call:", content);
      throw new Error(`Failed to call function. Context:\n${content}`);
    }

    return response;
  } catch (exc) {
    console.error("LLM Error:", {
      message: exc.message,
      status: exc.status,
      response: exc.response?.data,
      requestParams: {
        ...requestParams,
        messages: requestParams.messages.length,
        apiKey: "[REDACTED]",
      },
    });
    throw new Error(`Error getting LLM Response: ${exc.message}`);
  }
};

export const reviewDiff = async (
  traceTag: string,
  convo: ChatMessage[],
  model: LLModel = "gpt-3.5-turbo"
) => {
  const groq = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
  });

  const requestParams = {
    messages: convo,
    model: "llama-3.1-8b-instant",
    temperature: 0,
  };
  try {
    const chatCompletion = await groq.chat.completions.create(requestParams);
    return chatCompletion.choices[0].message.content;
  } catch (exc) {
    console.error("LLM Error:", exc);
    throw new Error("Error getting LLM response");
  }
};
