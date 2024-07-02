import { createResolvers } from '../axolotl.js';
import { APIKeyModel } from '../orm.js';
import { getReplicateImage } from '../shared/replicate.js';
import { openAIImage } from '../shared/openai.js';
import { TaskType } from '../models.js';

export default createResolvers({
  ImageGenerationQuery: {
    alaradirikDepthMidas: async ([source], args) => {
      const src = source as APIKeyModel;
      const modelName = 'alaradirik/t2i-adapter-sdxl-depth-midas';
      return getReplicateImage({
        name: 'alaradirikDepthMidas',
        modelVersion: '8a89b0ab59a050244a751b6475d91041a8582ba33692ae6fab65e0c51b700328',
        modelName,
        modelType: 'image',
        replicateKey: src.replicateKey,
        params: args.input,
      });
    },
    alaradirikLineart: async ([source], args) => {
      const src = source as APIKeyModel;
      const modelName = 'alaradirik/t2i-adapter-sdxl-lineart';
      return getReplicateImage({
        name: 'alaradirikLineart',
        modelVersion: 'a3d3e0bdeea4925a873179e55701e1091e4b4d7ddeee9a205b932d9de1d9f181',
        modelName,
        modelType: 'image',
        replicateKey: src.replicateKey,
        params: args.input,
      });
    },
    anythingv4dot0: async ([source], args) => {
      const src = source as APIKeyModel;
      const modelName = 'Anything 4.0';
      return getReplicateImage({
        name: 'anythingv4dot0',
        modelVersion: '42a996d39a96aedc57b2e0aa8105dea39c9c89d9d266caf6bb4327a1c191b061',
        modelName,
        modelType: 'image',
        replicateKey: src.replicateKey,
        params: args.input,
      });
    },
    dalle: async ([source], args) => {
      const src = source as APIKeyModel;
      return openAIImage(src.openAiKey, args.input.prompt);
    },
    kandinsky2: async ([source], args) => {
      const src = source as APIKeyModel;
      const modelName = 'Kandinsky 2';
      return getReplicateImage({
        name: 'kandinsky-2.2',
        modelVersion: 'ea1addaab376f4dc227f5368bbd8eff901820fd1cc14ed8cad63b29249e9d463',
        modelName,
        modelType: 'image',
        replicateKey: src.replicateKey,
        params: args.input,
      });
    },
    openJourney: async ([source], args) => {
      const src = source as APIKeyModel;
      const modelName = 'Open Journey';
      return getReplicateImage({
        name: 'openJourney',
        modelVersion: 'ad59ca21177f9e217b9075e7300cf6e14f7e5b4505b87b9689dbd866e9768969',
        modelName,
        modelType: 'image',
        replicateKey: src.replicateKey,
        params: args.input,
      });
    },
    stableDiffusion21: async ([source], args) => {
      const src = source as APIKeyModel;
      const modelName = 'Stable Diffusion';
      return getReplicateImage({
        name: 'stableDiffusion21-next',
        modelVersion: '7ca7f0d3a51cd993449541539270971d38a24d9a0d42f073caf25190d41346d7',
        modelName,
        modelType: 'image',
        replicateKey: src.replicateKey,
        params: args.input,
      });
    },
    swinir: async ([source], args) => {
      const src = source as APIKeyModel;
      const modelName = 'swinir';
      return getReplicateImage({
        name: 'swinir',
        modelVersion: '660d922d33153019e8c263a3bba265de882e7f4f70396546b6c9c8f9d47a021a',
        modelName,
        modelType: 'upscale',
        replicateKey: src.replicateKey,
        params: {
          prompt: args.input.name,
          image: args.input.fileURL,
          task_type: getTaskTypeSwinir(args.input.taskType),
        },
      });
    },
    qr2aiOutline: async ([source], args) => {
      const src = source as APIKeyModel;
      const modelName = 'qr2ai/outline';
      return getReplicateImage({
        name: 'qr2aiOutline',
        modelVersion: '61604f94e65b0a41ecbf2c1e8f6f862f65614f11b6e80ccf3e611fb8d08efe31',
        modelName,
        modelType: 'image',
        replicateKey: src.replicateKey,
        params: args.input,
      });
    },
    timothybrooksPix2pix: async ([source], args) => {
      const src = source as APIKeyModel;
      const modelName = 'timothybrooks/instruct-pix2pix';
      return getReplicateImage({
        name: 'timothybrooksPix2pix',
        modelVersion: '30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f',
        modelName,
        modelType: 'image',
        replicateKey: src.replicateKey,
        params: args.input,
      });
    },
  },
});

const getTaskTypeSwinir = (taskType: TaskType): string => {
  switch (taskType) {
    case TaskType.RESOLUTION_LARGE:
      return 'Real-World Image Super-Resolution-Large';
    case TaskType.RESOLUTION_MEDIUM:
      return 'Real-World Image Super-Resolution-Medium';
  }
};
