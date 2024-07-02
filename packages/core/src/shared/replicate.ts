import fetch, { Response } from 'node-fetch';
import { imageUploaderRaw } from './imageUploader.js';
import { LLamaV2_Options, SchedulerForAladirik, SchedulerFotTimothybrooks } from '../models.js';
import { getEnv } from '../utils.js';
import jwt from 'jsonwebtoken';
import { LLamaV2Input } from '../models.js';

const REPLICATE_BASE_URL = `https://api.replicate.com/v1`;
const SECRET = getEnv('JWT_SECRET');

const callReplicate = async (secretKey: string, url: string, body: unknown) => {
  const response = await fetch(`${REPLICATE_BASE_URL}/${url}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${secretKey.length > 60 ? jwt.verify(secretKey, SECRET) : secretKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${await response.text()}`);
  return response.json() as Promise<PredictionCreateResponse>;
};

type ModelType = 'image' | 'upscale' | 'conversation';

type Params = {
  prompt: string;
  image?: string | null;
  task_type?: string;
  max_tokens?: number | null;
  negative_prompt?: string | null;
  width?: number | null;
  height?: number | null;
  seed?: number | null;
  random_seed?: number | null;
  scheduler?: SchedulerForAladirik | SchedulerFotTimothybrooks | null;
};

type ImageInput = {
  input: Params;
};

const MAX_TOKENS_CONSUMED = 15;

const fetchUntilDoneOrQuit = (
  {
    predictionGetURL,
    modelType,
    maxTokens,
    tokensConsumed = 0,
  }: {
    predictionGetURL: string;
    modelType: ModelType;
    maxTokens?: number | null;
    tokensConsumed?: number;
  },
  secretKey: string,
): Promise<
  | {
      __typename: 'result';
      result: string;
      tokensConsumed: number;
    }
  | {
      __typename: 'error';
      error: string;
      tokensConsumed: number;
    }
> => {
  return new Promise((resolve) => {
    fetch(predictionGetURL, {
      headers: {
        Authorization: `Token ${secretKey.length > 60 ? jwt.verify(secretKey, SECRET) : secretKey}`,
      },
    })
      .then((r) => r.json())
      .then((predictionResults: unknown) => {
        const predictionResult = predictionResults as PredictionCreateResponse;
        if (predictionResult.status === 'succeeded' && predictionResult.output && predictionResult.output.length > 0) {
          resolve({
            __typename: 'result',
            result:
              modelType === 'upscale'
                ? (predictionResult.output as string)
                : modelType === 'conversation'
                  ? (predictionResult.output as string[]).join('')
                  : predictionResult.output[0],
            tokensConsumed,
          });
        } else if (predictionResult.status === 'starting') {
          setTimeout(() => {
            fetchUntilDoneOrQuit({ predictionGetURL, modelType, maxTokens, tokensConsumed }, secretKey).then(resolve);
          }, 2000);
        } else {
          maxTokens = maxTokens || MAX_TOKENS_CONSUMED;
          if (tokensConsumed > maxTokens) {
            resolve({
              __typename: 'error',
              error: 'TOKENS' as const,
              tokensConsumed,
            });
          } else {
            setTimeout(() => {
              fetchUntilDoneOrQuit(
                { predictionGetURL, modelType, maxTokens, tokensConsumed: tokensConsumed + 1 },
                secretKey,
              ).then(resolve);
            }, 2000);
          }
        }
      });
  });
};
const replicate = async ({
  secretKey,
  imageInput,
  modelType,
  modelVersion,
}: {
  secretKey: string;
  modelVersion: string;
  imageInput: ImageInput;
  modelType: ModelType;
}) => {
  const replicateResult: PredictionCreateResponse = await callReplicate(secretKey, 'predictions', {
    version: modelVersion,
    ...imageInput,
  });
  if (!replicateResult?.urls?.get)
    throw new Error(`Replicate is not responding, please check your Key. Error: ${replicateResult?.error}`);
  const predictionGetURL = replicateResult.urls.get;
  const predictionResult = await fetchUntilDoneOrQuit(
    { predictionGetURL, modelType, maxTokens: imageInput.input.max_tokens },
    secretKey,
  );
  if (predictionResult.__typename === 'error') throw new Error(`${predictionResult?.error}`);
  return predictionResult;
};

export const getReplicateImage = async ({
  modelName,
  modelType,
  modelVersion,
  name,
  params,
  creatorId,
  replicateKey,
}: {
  name: string;
  modelVersion: string;
  modelName: string;
  params: Params;
  modelType: ModelType;
  creatorId?: string;
  replicateKey: string;
}) => {
  const getFromReplicate = await replicate({
    secretKey: replicateKey,
    modelVersion,
    imageInput: {
      input: params,
    },
    modelType,
  });
  const imageResponse: Response = await fetch(getFromReplicate.result);
  const imResponseType = imageResponse.headers.get('content-type');
  if (imResponseType?.startsWith('image/')) {
    const imageKey = `${name}-${params.prompt}`;
    return imageUploaderRaw({
      name: imageKey,
      prompt: params.prompt,
      contentType: imResponseType,
      response: await imageResponse.arrayBuffer(),
      modelName,
      creatorId,
    });
  }
};
const defaultTextGenerationOptions: LLamaV2_Options = {
  top_p: 1,
  temperature: 0.75,
  repetition_penalty: 1,
  max_length: 500,
};

export const callReplicateLlama = async ({
  input,
  replicateToken,
}: {
  input: LLamaV2Input;
  replicateToken: string;
}) => {
  const llama = 'df7690f1994d94e96ad9d568eac121aecf50684a0b0963b25a41cc40061269e5';
  const response = await replicate({
    secretKey: replicateToken,
    modelVersion: llama,
    imageInput: {
      input: {
        prompt: `User: ${input.userMessage}\n\nAssistant: `,
        ...defaultTextGenerationOptions,
        ...input.options,
      },
    },
    modelType: 'conversation',
  });
  return response.result;
};

type ReplicateStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
export interface PredictionCreateResponse {
  id: string;
  version: string;
  urls: Urls;
  created_at: string;
  started_at: string;
  completed_at: string;
  status: ReplicateStatus;
  input: ImageInput;
  output?: string[] | string;
  error?: string;
  logs?: string;
  metrics: Metrics;
}

export interface Metrics {
  predict_time: number;
}

export interface Urls {
  get: string;
  cancel: string;
}
