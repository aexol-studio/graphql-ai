import { createResolvers } from '../axolotl.js';
import { APIKeyModel } from '../orm.js';
import { openAIcreateChatCompletion } from '../shared/openai.js';
import { callReplicateLlama } from '../shared/replicate.js';
export default createResolvers({
  ConversationalQuery: {
    chatGPT35Turbo: async ([source], args) => {
      const src = source as APIKeyModel;
      const ai = await openAIcreateChatCompletion(src.openAiKey, args.input);
      return {
        createdAt: new Date().toISOString(),
        message: {
          content: ai.choices[0].message.content,
          role: ai.choices[0].message.role,
        },
      };
    },
    isolatedGPT35Turbo: async ([source]) => source,
    isolatedNetworkOps: async ([source]) => source,
    llamaV2: async ([source], args) => {
      const src = source as APIKeyModel;
      const ai = await callReplicateLlama({
        input: args.input,
        replicateToken: src.replicateKey,
      });
      return ai;
    },
    isolatedGPT35TurboMutation: async ([source]) => source,
  },
});
