import { getUrl, putUrl } from '../s3/S3.js';
import fetch, { BodyInit } from 'node-fetch';
import { MongOrb } from '../orm.js';
import { getPlaiceholder } from 'plaiceholder';
import sharp from 'sharp';
import { ImageType } from '../models.js';

export const imageUploaderRaw = async ({
  contentType,
  modelName,
  name,
  prompt,
  response,
  creatorId,
}: {
  name: string;
  prompt: string;
  contentType: string;
  response: ArrayBuffer;
  modelName: string;
  creatorId?: string;
}) => {
  // const blob = response.response;
  const fileKey = name + Math.random().toString(16).split('.')[1];
  const thumbnailKey = fileKey + '-thumbnail';
  const responseBuffer = Buffer.from(response);
  const thumbnailBuffer = await sharp(responseBuffer)
    .resize({
      width: 256,
    })
    .toBuffer();

  const placeholderBase = await (await getPlaiceholder(responseBuffer)).base64;

  const [put, putThumbnail] = await Promise.all([
    putUrl({
      contentType,
      fileKey,
    }),
    putUrl({
      contentType,
      fileKey: thumbnailKey,
    }),
  ]);

  await Promise.all([
    fetch(put.putUrl, {
      method: 'PUT',
      body: response as BodyInit,
      headers: {
        'Content-Type': contentType,
      },
    }),
    fetch(putThumbnail.putUrl, {
      method: 'PUT',
      body: thumbnailBuffer,
      headers: {
        'Content-Type': contentType,
      },
    }),
  ]);
  const url = await getUrl(put.fileKey);
  await MongOrb('GeneratedImage').createWithAutoFields(
    '_id',
    'createdAt',
  )({
    key: fileKey,
    prompt,
    creatorId,
    placeholderBase64: placeholderBase,
    thumbnailKey,
    model: modelName,
    imageType: modelName === 'swinir' ? ImageType.UPSCALED : ImageType.GENERATED,
  });
  return url;
};
