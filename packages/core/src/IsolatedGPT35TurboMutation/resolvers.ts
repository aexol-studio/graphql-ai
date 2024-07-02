import { createResolvers } from '../axolotl.js';
import { APIKeyModel, FineTuneJobModel, MongOrb } from '../orm.js';
import { FineTuneJobStatus, GPT35_Role } from '../models.js';
import { createJobWithPause, createJobWithUploadFile, JobResponseObject, sendTextAsFile } from '../shared/fineTune.js';
import { uploadFile } from '../s3/S3.js';

export default createResolvers({
  IsolatedGPT35TurboMutation: {
    addDialog: async ([source], args) => {
      const result = await MongOrb('DialogCollection').createWithAutoFields(
        '_id',
        'createdAt',
      )({
        ...args.input,
        updatedAt: new Date().toISOString(),
      });
      return result.insertedId;
    },
    removeDialog: async ([source], args) => {
      const result = await MongOrb('DialogCollection').collection.deleteOne({
        _id: args._id,
      });
      return result.acknowledged;
    },
    updateDialog: async ([source], args) => {
      const result = await MongOrb('DialogCollection').collection.updateOne(
        {
          _id: args._id,
        },
        {
          $set: {
            ...args.input,
          },
        },
      );
      return result.acknowledged;
    },
    updateFineTuneModel: async ([source], args) => {
      const result = await MongOrb('FineTuneJobsCollection').collection.updateOne(
        {
          _id: args._id,
        },
        {
          $set: {
            model_name: args.model_name,
          },
        },
      );
      return result.acknowledged;
    },
    createIsolatedContext: async ([source], args) => {
      const hasSystemMessages = !!args.input.gpt.messages.filter((gptMessage) => gptMessage.role === GPT35_Role.system)
        .length;
      const messages = hasSystemMessages
        ? [...args.input.gpt.messages]
        : [
            {
              role: GPT35_Role.system,
              content: `You are a knowledge base explorer. The knowledge base are the messages within current conversation. If there is anything about the question within conversation you answer if not you answer with one word: "NO"`,
            },
            ...args.input.gpt.messages,
          ];
      const options = Object.fromEntries(Object.entries(args.input.gpt?.options || {}).filter(([_, v]) => v != null));
      const result = await MongOrb('IsolatedConversationalContext').createWithAutoFields(
        '_id',
        'createdAt',
      )({
        messages,
        name: args.input.name,
        options,
      });
      return result.insertedId;
    },
    fineTuningIsolatedContext: async ([source], args) => {
      const src = source as APIKeyModel;
      const ctx = await MongOrb('IsolatedConversationalContext').collection.findOne({
        _id: args._id,
      });
      if (!ctx) {
        throw new Error(`Content with id: ${args._id} does not exist in your team`);
      }

      const dialogs = await MongOrb('DialogCollection')
        .collection.find({
          contextId: args._id,
        })
        .toArray();

      if (!dialogs.length) {
        throw new Error(`Not found dialogs for context with _id:${args._id}!`);
      }
      if (dialogs.length < 10) {
        throw new Error(
          `There are only ${dialogs.length} dialogs in this context, but you need at least 10 to train your own model!`,
        );
      }

      let textContent: string = JSON.stringify({
        messages: (dialogs[0].editedContext || ctx.messages).concat(dialogs[0].messages || []),
      });
      for (let i = 1; i < dialogs.length; i++) {
        textContent = textContent.concat(
          '\n' +
            JSON.stringify({
              messages: (dialogs[i].editedContext || ctx.messages).concat(dialogs[i].messages || []),
            }),
        );
      }

      const upload: JobResponseObject = await sendTextAsFile(textContent, src.openAiKey);
      if (!upload.id) throw new Error(`Upload error: ${upload.error?.message}`);
      const result = await MongOrb('FineTuneJobsCollection').createWithAutoFields(
        '_id',
        'createdAt',
      )({
        status: FineTuneJobStatus.uploading,
        training_file_id: upload.id,
        contextId: args._id,
        contextName: ctx.name,
      });
      const o = await MongOrb('FineTuneJobsCollection').collection.findOne({ _id: result.insertedId });
      if (!o) throw new Error('Invalid mongo operation');
      await createJobWithPause(o, src.openAiKey);
      return result.insertedId;
    },
    fineTuningWithFile: async ([source], args) => {
      const src = source as APIKeyModel;
      if (!src.openAiKey) throw new Error('OpenAiKey not found');
      const ctx = await MongOrb('IsolatedConversationalContext').collection.findOne({
        _id: args._id,
      });
      if (!ctx) {
        throw new Error(`Content with id: ${args._id} does not exist in your team`);
      }

      const reg = args.file ? await uploadFile(args.file.fileKey, args.file.contentType) : undefined;
      const up = await MongOrb('IsolatedConversationalContext').collection.updateOne(
        { _id: args._id },
        {
          $set: { treningFileKey: reg?.fileKey },
        },
      );

      const baseJobData: Omit<FineTuneJobModel, '_id' | 'createdAt'> = {
        status: FineTuneJobStatus.error,
        contextId: args._id,
        contextName: ctx.name,
        training_file_id: '',
      };

      const result = await MongOrb('FineTuneJobsCollection').createWithAutoFields('_id', 'createdAt')(baseJobData);
      const o = await MongOrb('FineTuneJobsCollection').collection.findOne({ _id: result.insertedId });
      if (!o) throw new Error('Invalid mongo operation');
      await createJobWithUploadFile({ ...o, _id: result.insertedId }, src.openAiKey, args);
      return { job_id: result.insertedId, putUrl: reg?.putUrl };
    },
    updateIsolatedContext: async ([source], args) => {
      const src = source as APIKeyModel;
      const result = await MongOrb('IsolatedConversationalContext').collection.updateOne(
        {
          _id: args._id,
          teamId: src._id,
        },
        {
          $set: {
            messages: args.input.gpt?.messages || undefined,
            name: args.input.name || undefined,
            options:
              {
                ...args.input.gpt?.options,
                frequency_penalty: args.input.gpt?.options?.frequency_penalty || undefined,
                max_tokens: args.input.gpt?.options?.max_tokens || undefined,
                presence_penalty: args.input.gpt?.options?.presence_penalty || undefined,
                temperature: args.input.gpt?.options?.temperature || undefined,
                top_p: args.input.gpt?.options?.top_p || undefined,
              } || undefined,
          },
        },
      );
      return !!result.modifiedCount;
    },
    removeIsolatedContext: async ([source], args) => {
      const src = source as APIKeyModel;
      const result = await MongOrb('IsolatedConversationalContext').collection.deleteOne({
        _id: args._id,
        teamId: src._id,
      });
      return !!result.deletedCount;
    },
    deleteFineTuneModel: async ([source], args) => {
      const src = source as APIKeyModel;
      const job = await MongOrb('FineTuneJobsCollection').collection.findOne({
        _id: args._id,
      });
      if (!job) throw new Error('Job with _id and teamId not found');

      //Delete a fine-tuned model (must be an owner of the org the model was created in)
      let deleted = { ok: true, delError: {} };
      if (job.model_id) {
        if (!src.openAiKey) throw new Error('OpenAiKey not found');
        const deleteJob = (await (
          await fetch(`https://api.openai.com/v1/models/${job.model_id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${src.openAiKey}`,
            },
          })
        )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .json()) as { id?: string; object?: string; deleted?: boolean; error?: any | undefined };
        deleted = { ok: deleteJob?.deleted || false, delError: deleteJob?.error };
      }
      if (!deleted.ok) throw new Error(`${deleted.delError}`);

      const result = await MongOrb('FineTuneJobsCollection').collection.deleteOne({
        _id: args._id,
      });
      const context = await MongOrb('IsolatedConversationalContext').collection.findOne({ _id: job.contextId });
      if (job.model_id && context?.ftModel === job.model_id) {
        await MongOrb('IsolatedConversationalContext').collection.updateOne(
          { _id: job.contextId },
          {
            $unset: {
              ftModel: true,
            },
          },
        );
      }

      return !!result.deletedCount;
    },
  },
});
