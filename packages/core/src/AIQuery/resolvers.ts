import { createResolvers } from '../axolotl.js';
import { APIKeyModel } from '../orm.js';

export default createResolvers({
  AIQuery: {
    assets: async ([source]) => source as APIKeyModel,
    conversational: async ([source]) => source as APIKeyModel,
    imageGeneration: async ([source]) => source as APIKeyModel,
  },
});
