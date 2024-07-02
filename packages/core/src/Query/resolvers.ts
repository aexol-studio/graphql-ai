import { createResolvers } from '../axolotl.js';
import { checkApiToken } from '../shared/apiKey.js';
import { MongOrb } from '../orm.js';
import { getUrl, putUrl } from '../s3/S3.js';

const QueryResolvers = createResolvers({
  Query: {
    ai: (yoga) => {
      return checkApiToken(yoga[2]);
    },
    apiKeys: async () => {
      return MongOrb('APIKey').collection.find({}).toArray();
    },
    styleTemplates: () => MongOrb('StyleTemplate').collection.find({}).toArray(),
    styleTemplate: async (_, args) => MongOrb('StyleTemplate').collection.findOne({ _id: args.styleTemplateId }),
    getFileURL: async (_, args) => getUrl(args.fileKey),
    getFilePutURL: async (_, args) => putUrl(args.fileInput),
  },
});
export default QueryResolvers;
