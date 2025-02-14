import { iGraphQL, MongoModel } from 'i-graphql';
import { MongoClient, ObjectId } from 'mongodb';
import {
  APIKey,
  GeneratedImage,
  IsolatedContextNetwork,
  IsolatedConversationalContext,
  FineTuneJob,
  Dialog,
  StyleTemplate,
} from './models.js';

export type GeneratedImageModel = GeneratedImage;
export type APIKeyModel = APIKey & { hashedToken: string };
export type IsolatedConversationalContextModel = IsolatedConversationalContext;
export type IsolatedContextNetworkModel = MongoModel<IsolatedContextNetwork>;
export type FineTuneJobModel = FineTuneJob;
export type DialogModel = Dialog;
export type StyleTemplateModel = StyleTemplate;
const orm = async () => {
  return iGraphQL<
    {
      GeneratedImage: GeneratedImageModel;
      APIKey: APIKeyModel;
      IsolatedConversationalContext: IsolatedConversationalContextModel;
      IsolatedContextNetwork: IsolatedContextNetworkModel;
      FineTuneJobsCollection: FineTuneJobModel;
      DialogCollection: DialogModel;
      StyleTemplate: StyleTemplateModel;
    },
    {
      _id: () => string;
      createdAt: () => string;
    }
  >(
    {
      APIKey: '_id',
      DialogCollection: '_id',
      FineTuneJobsCollection: '_id',
      GeneratedImage: '_id',
      IsolatedContextNetwork: '_id',
      IsolatedConversationalContext: '_id',
      StyleTemplate: '_id',
    },
    {
      autoFields: {
        _id: () => new ObjectId().toHexString(),
        createdAt: () => new Date().toISOString(),
      },
      mongoClient: new MongoClient(process.env.MONGO_URL || '', {}),
    },
  );
};

export const MongOrb = await orm();
