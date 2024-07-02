import { createResolvers } from '../axolotl.js';
import { APIKeyModel, MongOrb } from '../orm.js';
import { createFineTuneJob, retrieveJob } from '../shared/fineTune.js';
import { openAIcreateChatCompletion } from '../shared/openai.js';
import { GPT35_Role } from '../models.js';

export default createResolvers({
  IsolatedGPT35TurboQuery: {
    getFineTuneJobs: async (input, args) => {
      return MongOrb('FineTuneJobsCollection').collection.find({}).toArray();
    },
    listDialogs: async (input, args) => {
      return MongOrb('DialogCollection').collection.find({}).toArray();
    },
    chatGPT35TurboInformationFeed: async ([source], args) => {
      const src = source as APIKeyModel;
      const ai = await openAIcreateChatCompletion(src.openAiKey, {
        ...args.input,
        messages: [
          {
            role: GPT35_Role.system,
            content:
              'You are a memory. Just remember everything that is inputted from user in this conversation and only say I remembered after each message',
          },
          ...args.input.messages,
        ],
      });
      if (!ai?.choices)
        throw new Error(`OpenAi is not responding, please check your API Key. Error: ${ai?.error?.message}`);
      return {
        createdAt: new Date().toISOString(),
        message: {
          content: ai.choices[0].message.content,
          role: ai.choices[0].message.role,
        },
      };
    },
    listIsolatedContexts: async () => {
      MongOrb('IsolatedConversationalContext').collection.find({}).toArray();
    },
    previewIsolatedContext: async ([source], args) => {
      return await MongOrb('IsolatedConversationalContext').collection.findOne({
        _id: args._id,
      });
    },
    retrieveJob: async ([source], args) => {
      const src = source as APIKeyModel;
      const jobObject = await MongOrb('FineTuneJobsCollection').collection.findOne({ _id: args._id });
      if (!jobObject) throw new Error('Job object not found');
      if (jobObject?.model_id) {
        await MongOrb('IsolatedConversationalContext').collection.updateOne(
          { _id: jobObject.contextId },
          {
            $set: {
              ftModel: jobObject.model_id,
            },
          },
        );
        return jobObject;
      }
      if (!jobObject?.job_id) {
        return await createFineTuneJob(jobObject, src.openAiKey);
      }
      return await retrieveJob(jobObject, src.openAiKey);
    },
    useIsolatedContext: async ([source], args) => {
      const src = source as APIKeyModel;
      const ctx = await MongOrb('IsolatedConversationalContext').collection.findOne({
        _id: args.contextId,
      });
      if (!ctx) {
        throw new Error(`Content with id: ${args.contextId} does not exist in your team`);
      }
      if (args.useOwnModel && !ctx.ftModel) throw new Error('FineTuned model not found for this context');
      const dialog = args.dialogId
        ? await MongOrb('DialogCollection').collection.findOne({
            _id: args.dialogId,
          })
        : undefined;
      const contextIncludesSystemMessage = !!ctx.messages.filter((m) => m.role === GPT35_Role.system).length;
      const messages = [...(dialog?.editedContext || ctx.messages), ...args.input.messages];
      if (!contextIncludesSystemMessage) {
        messages.unshift({
          role: GPT35_Role.system,
          content: `You are a knowledge base explorer. The knowledge base are the messages within current conversation. If there is anything about the question within conversation you answer if not you answer with one word: "NO"`,
        });
      }
      const ftModel = args.useOwnModel ? ctx.ftModel : undefined;
      const ai = await openAIcreateChatCompletion(
        src.openAiKey,
        {
          messages,
          options: args.input.options,
        },
        ftModel,
      );
      const generatedMessage = {
        content: ai.choices[0].message.content,
        role: ai.choices[0].message.role,
      };
      return {
        createdAt: new Date().toISOString(),
        message: generatedMessage,
      };
    },
  },
});
