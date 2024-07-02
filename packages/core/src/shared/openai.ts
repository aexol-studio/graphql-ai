import fetch from 'node-fetch';
import { imageUploaderRaw } from './imageUploader.js';
import { getEnv } from '../utils.js';
import jwt from 'jsonwebtoken';
import { GPT35_Input, GPT35_Message, TextGenerationTask, TextGenerationTask_Input } from '../models.js';

const SECRET = getEnv('JWT_SECRET');

const defaultTextGenerationOptions: TextGenerationTask = {
  top_p: 1,
  temperature: 0.7,
  presence_penalty: 0,
  frequency_penalty: 0,
};

export const openAIcreateChatCompletion = async (openAiKey: string, input: GPT35_Input, ftModel?: string) => {
  const model = ftModel || `gpt-3.5-turbo-16k`;
  const { messages, options, user } = input;
  const result = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey.length > 60 ? jwt.verify(openAiKey, SECRET) : openAiKey}`,
      ['Content-Type']: 'application/json',
    },
    body: JSON.stringify({
      model: model,
      ...defaultTextGenerationOptions,
      messages,
      user,
      ...options,
    }),
  });
  const json = (await result.json()) as {
    error?: { message: string };
    id: string;
    object: string;
    created: number;
    choices: Array<{ index: number; message: GPT35_Message; finish_reason: string }>;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };

  if (!json?.choices)
    throw new Error(`OpenAi  is not responding, please check your API Key. Error: ${json?.error?.message}`);
  return json;
};

export const openAITextCompletion = async (openAiKey: string, prompt: string, input?: TextGenerationTask_Input) => {
  const result = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey.length > 60 ? jwt.verify(openAiKey, SECRET) : openAiKey}`,
      ['Content-Type']: 'application/json',
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt,
      ...input,
    }),
  });
  const json = (await result.json()) as {
    error?: { message: string };
    id: string;
    object: string;
    created: number;
    choices: Array<{ index: number; text: string; finish_reason: string }>;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  if (!json?.choices)
    throw new Error(`OpenAi  is not responding, please check your API Key. Error: ${json?.error?.message}`);
  return json;
};

export const openAIImage = async (key: string, prompt: string, creatorId?: string) => {
  const start = Date.now();
  const result = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      ['Content-Type']: 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
    }),
  });

  const json = await result.json();
  const responseData = json as {
    error?: { message: string };
    created: number;
    data: Array<{ url: string }>;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  if (!responseData?.data)
    throw new Error(`OpenAi  is not responding, please check your API Key. Error: ${responseData?.error?.message}`);
  const imageResponse = await fetch(responseData.data[0].url);
  const modelName = 'DALL-E';
  const imResponseType = imageResponse.headers.get('content-type');
  if (imResponseType?.startsWith('image/')) {
    const imageKey = `${name}-${prompt}`;
    return imageUploaderRaw({
      name: imageKey,
      prompt,
      modelName,
      response: await imageResponse.arrayBuffer(),
      contentType: imResponseType,
    });
  }
};
