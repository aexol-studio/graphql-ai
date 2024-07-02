import { createResolvers } from '../axolotl.js';
import { MongOrb } from '../orm.js';
import { generateAPIKey } from '../shared/apiKey.js';

export default createResolvers({
  Mutation: {
    createStyleTemplate: async (_, args) => {
      const op = await MongOrb('StyleTemplate').createWithAutoFields('_id', 'createdAt')(args.style);
      return !!op.insertedId;
    },
    deleteAPIKey: async (_, args) => {
      const result = await MongOrb('APIKey').collection.deleteOne({
        _id: args._id,
      });
      return result.acknowledged;
    },
    generateAPIKey: async (_, args) => {
      const { hashedToken, token } = await generateAPIKey();
      const result = await MongOrb('APIKey').createWithAutoFields(
        'createdAt',
        '_id',
      )({
        ...args.key,
        hashedToken,
      });
      if (!result.insertedId) {
        throw new Error('Cannot create a token');
      }
      return token;
    },
    deleteStyleTemplate: async (_, args) => {
      const result = await MongOrb('StyleTemplate').collection.deleteOne({
        _id: args._id,
      });
      return result.acknowledged;
    },
    editStyleTemplate: async (_, args) => {
      const result = await MongOrb('StyleTemplate').collection.updateOne(
        {
          _id: args._id,
        },
        {
          $set: {
            ...args.style,
          },
        },
      );
      return result.acknowledged;
    },
  },
});
