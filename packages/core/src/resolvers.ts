import { createResolvers } from './axolotl.js';
import AIQuery from './AIQuery/resolvers.js';
import AssetsQuery from './AssetsQuery/resolvers.js';
export default createResolvers({
  ...AIQuery,
  ...AssetsQuery,
});
