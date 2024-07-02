import { createResolvers } from '../axolotl.js';
import { IsolatedConversationalContextModel, MongOrb } from '../orm.js';

export default createResolvers({
  IsolatedConversationalContext: {
    testDialogs: async ([source]) => {
      const src = source as IsolatedConversationalContextModel;
      return MongOrb('DialogCollection').collection.find({
        contextId: src._id,
      });
    },
  },
});
