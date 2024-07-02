import { createResolvers } from '../axolotl.js';
import { IsolatedContextNetworkModel, MongOrb } from '../orm.js';

export default createResolvers({
  IsolatedContextNetwork: {
    contexts: async ([source]) => {
      const src = source as IsolatedContextNetworkModel;
      if (!src.contexts) return null;
      return MongOrb('IsolatedConversationalContext')
        .collection.find({
          _id: {
            $in: src.contexts,
          },
        })
        .toArray();
    },
    networks: async ([source]) => {
      const src = source as IsolatedContextNetworkModel;
      if (!src.networks) return null;
      return MongOrb('IsolatedContextNetwork').collection.find({
        _id: {
          $in: src.networks,
        },
      });
    },
  },
});
