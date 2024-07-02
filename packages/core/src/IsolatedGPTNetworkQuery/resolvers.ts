import { createResolvers } from '../axolotl.js';
import { APIKeyModel, MongOrb } from '../orm.js';
import { GPT35_Role } from '../models.js';
import { openAIcreateChatCompletion } from '../shared/openai.js';

export default createResolvers({
  IsolatedGPTNetworkQuery: {
    createIsolatedNetwork: async ([source], args) => {
      const result = await MongOrb('IsolatedContextNetwork').createWithAutoFields(
        '_id',
        'createdAt',
      )({
        ...args.network,
      });
      return result.insertedId;
    },
    removeIsolatedNetwork: async ([source], args) => {
      const result = await MongOrb('IsolatedContextNetwork').collection.deleteOne({
        _id: args._id,
      });
      return result.acknowledged;
    },
    listIsolatedNetworks: async () => {
      return MongOrb('IsolatedContextNetwork').collection.find({}).toArray();
    },
    previewIsolatedNetwork: async ([source], args) => {
      return MongOrb('IsolatedContextNetwork').collection.findOne({
        _id: args._id,
      });
    },
    queryIsolatedNetwork: async ([source], args) => {
      const src = source as APIKeyModel;
      const ctx = await MongOrb('IsolatedContextNetwork').collection.findOne({
        _id: args._id,
      });
      if (!ctx) {
        throw new Error(`Content with id: ${args._id} does not exist in your team`);
      }
      const contexts = await MongOrb('IsolatedContextNetwork').related(
        [ctx],
        'contexts',
        'IsolatedConversationalContext',
        '_id',
      );
      const lastMessage = args.input.messages[args.input.messages.length - 1];
      const editedMessage = {
        ...lastMessage,
        content: `Do you have knowledge how to answer the following question basing on current Conversation history? If no please answer just "NO" else please answer. The question: ${lastMessage.content}`,
      };

      const answers = await Promise.all(
        contexts.map(async (subCtx) => {
          const hasSystemMessages = !!subCtx.messages.filter((m) => m.role === GPT35_Role.system).length;
          const messages = [...subCtx.messages, editedMessage];
          if (!hasSystemMessages) {
            messages.unshift({
              role: GPT35_Role.system,
              content: `You are a knowledge base explorer. The knowledge base are the messages within current conversation. If there is anything about the question within conversation you answer if not you answer with one word: "NO"`,
            });
          }
          const ai = await openAIcreateChatCompletion(src.openAiKey, {
            messages,
            options: args.input.options,
          });
          const choice = ai.choices[0].message;
          const hasContent = choice.content.toLowerCase() !== 'no';
          return {
            usage: ai.usage.total_tokens,
            hasContent,
            choice,
            name: subCtx.name,
          };
        }),
      );

      const testMessage = Object.fromEntries(
        answers.filter((a) => a.hasContent).map((a) => [a.name, a.choice.content]),
      );
      const stringifiedMessage = JSON.stringify({
        question: lastMessage.content,
        answers: testMessage,
      });

      const orchestrator = await openAIcreateChatCompletion(src.openAiKey, {
        messages: [
          {
            content:
              ctx.system ||
              `Your role is to compose answer out of answers provided by different contexts. You will receive a JSON with question and answers. Please choose the best answers and format it to one string`,
            role: GPT35_Role.system,
          },
          {
            content: stringifiedMessage,
            role: GPT35_Role.user,
          },
        ],
        options: args.input.options,
      });

      return {
        rawResponse: JSON.stringify(testMessage, null, 4),
        gpt: {
          createdAt: new Date().toISOString(),
          message: {
            content: orchestrator.choices[0].message.content,
            role: GPT35_Role.assistant,
          },
        },
      };
    },
    updateIsolatedNetwork: async ([source], args) => {
      const result = await MongOrb('IsolatedContextNetwork').collection.updateOne(
        {
          _id: args._id,
        },
        {
          $set: {
            ...args.network,
            name: args.network.name || undefined,
          },
        },
      );
      return !!result.modifiedCount;
    },
  },
});
