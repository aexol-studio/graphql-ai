import { iGraphQL, MongoModel } from 'i-graphql';
import { ObjectId } from 'mongodb';
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
  >({
    _id: () => new ObjectId().toHexString(),
    createdAt: () => new Date().toISOString(),
  });
};

export const MongOrb = await orm();
