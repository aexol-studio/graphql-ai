import { createResolvers } from '../axolotl.js';
import { MongOrb } from '../orm.js';
import { getUrl } from '../s3/S3.js';

export default createResolvers({
  AssetsQuery: {
    conversations: async () => {
      return [];
    },
    images: async (_, args) => {
      const images = await MongOrb('GeneratedImage')
        .collection.find({
          ...(args.creatorId && { creatorId: args.creatorId }),
        })
        .toArray();
      const mappedImages = await Promise.all(
        images.map(async (i) => ({
          ...i,
          url: await getUrl(i.key),
          thumbnailUrl: i.thumbnailKey ? await getUrl(i.thumbnailKey) : null,
        })),
      );
      mappedImages.reverse();
      return mappedImages;
    },
    removeImage: async (_, args) => {
      const result = await MongOrb('GeneratedImage').collection.deleteOne({
        _id: args._id,
      });
      return !!result.deletedCount;
    },
    textDocuments: () => [],
  },
});
