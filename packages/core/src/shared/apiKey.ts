import bcrypt from 'bcrypt';
import { MongOrb } from '../orm.js';
import crypto from 'crypto';
import { YogaInitialContext } from 'graphql-yoga';

export const generateAPIKey = async () => {
  const saltRounds = 3;
  const token = crypto.randomUUID();
  const hashedToken = await bcrypt.hashSync(token, saltRounds);
  return {
    token,
    hashedToken,
  };
};

export const compareTokens = (key: string, hashedKeyFromDb: string) => {
  return bcrypt.compareSync(key, hashedKeyFromDb);
};

export const checkApiToken = async (yogaCtx: YogaInitialContext) => {
  const Key = yogaCtx.request.headers.get('Key');
  if (!Key) {
    throw new Error('Api key not provided. Add "Key" to request headers');
  }
  const tokens = await MongOrb('APIKey').collection.find().toArray();
  if (tokens.length === 0) {
    throw new Error('Api key does not exist inside this team');
  }
  const canMakeCalls = tokens.find((ak) => compareTokens(Key, ak.hashedToken));
  if (!canMakeCalls) {
    throw new Error('Invalid API key');
  }
  return canMakeCalls;
};
