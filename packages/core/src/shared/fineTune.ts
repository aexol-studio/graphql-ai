import { FineTuneJobModel, MongOrb } from '../orm.js';
import fetch, { FormData, Blob } from 'node-fetch';
import { FineTuneJobStatus } from '../models.js';
import { getUrl } from '../s3/S3.js';

export type JobResponseObject = {
  error?: ErrorMessage | null;
  id?: string;
  status?: string;
  organization_id?: string;
  model?: string;
  fine_tuned_model?: string;
  hyperparameters?: Hyper | null;
};
type Hyper = {
  n_epochs: number;
};
type ErrorMessage = {
  message: string | undefined;
};

// send text as File
export async function sendTextAsFile(textContent: string, key: string): Promise<JobResponseObject> {
  const url = 'https://api.openai.com/v1/files';
  const headers = {
    Authorization: `Bearer ${key}`,
  };

  const formData = new FormData();
  formData.append('purpose', 'fine-tune');
  formData.append('file', new Blob([textContent], { type: 'text/plain' }));

  const options = {
    method: 'POST',
    headers: headers,
    body: formData,
  };

  try {
    const response = await fetch(url, options);
    return (await response.json()) as JobResponseObject;
  } catch (error) {
    throw new Error(`Error: ${error}`);
  }
}

// Create a fine-tuning job with pause
export async function createJobWithPause(job: FineTuneJobModel, key: string) {
  const durationInMilliseconds = 3 * 60 * 1000; // 3 minutes in milliseconds
  await new Promise((resolve) => setTimeout(resolve, durationInMilliseconds));
  await createFineTuneJob(job, key);
}

// Create a fine-tuning job
export async function createFineTuneJob(job: FineTuneJobModel, key: string) {
  const data = {
    training_file: job.training_file_id,
    model: 'gpt-3.5-turbo-0613',
  };

  const response = (await (
    await fetch(`https://api.openai.com/v1/fine_tuning/jobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  ).json()) as JobResponseObject;

  await MongOrb('FineTuneJobsCollection').collection.updateOne(
    { _id: job._id },
    {
      $set: {
        ...(response.error?.message && { job_error: response.error?.message }),
        status: (response.status as FineTuneJobStatus) || FineTuneJobStatus.error,
        org_id: response.organization_id,
        model_name: response.model,
        job_id: response.id,
      },
    },
  );

  retrieveJobWithPause(job, key);
  return {
    ...job,
    ...(response.error?.message && { job_error: response.error?.message }),
    status: (response.status as FineTuneJobStatus) || FineTuneJobStatus.error,
    org_id: response.organization_id,
    model_name: response.model,
    job_id: response.id,
  };
}

// retrieveJobWithPause
export async function retrieveJobWithPause(job: FineTuneJobModel, key: string) {
  const pause = 10 * 60 * 1000;
  await new Promise((resolve) => setTimeout(resolve, pause));
  await retrieveJob(job, key);
}

// retrieveJob
export async function retrieveJob(job: FineTuneJobModel, key: string) {
  const jobRetrieve = (await (
    await fetch(`https://api.openai.com/v1/fine_tuning/jobs/${job.job_id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
      },
    })
  ).json()) as JobResponseObject;
  await MongOrb('FineTuneJobsCollection').collection.updateOne(
    { job_id: job.job_id },
    {
      $set: {
        ...(jobRetrieve.error?.message && { job_error: jobRetrieve.error?.message }),
        status: (jobRetrieve.status as FineTuneJobStatus) || FineTuneJobStatus.error,
        org_id: jobRetrieve.organization_id,
        model_id: jobRetrieve.fine_tuned_model,
        n_epochs: jobRetrieve.hyperparameters?.n_epochs || undefined,
      },
    },
  );

  if (jobRetrieve.fine_tuned_model) {
    await MongOrb('IsolatedConversationalContext').collection.updateOne(
      { _id: job.contextId },
      {
        $set: {
          ftModel: jobRetrieve.fine_tuned_model,
        },
      },
    );
  }

  if (jobRetrieve.status !== 'succeeded' && !jobRetrieve.error?.message) {
    retrieveJobWithPause(job, key);
  }
  return {
    ...job,
    ...(jobRetrieve.error?.message && { job_error: jobRetrieve.error?.message }),
    status: (jobRetrieve.status as FineTuneJobStatus) || FineTuneJobStatus.error,
    org_id: jobRetrieve.organization_id,
    model_id: jobRetrieve.fine_tuned_model,
    n_epochs: jobRetrieve.hyperparameters?.n_epochs,
  };
}

export async function createJobWithUploadFile(
  job: FineTuneJobModel,
  key: string,
  args: {
    _id: string;
    file?:
      | {
          fileKey: string;
          contentType: string;
        }
      | null
      | undefined;
  },
) {
  const pause1 = 10000; // 10 secund
  await new Promise((resolve) => setTimeout(resolve, pause1));
  const uploadId = await getFileTextAndSendAsFile(job._id, key, args);
  const pause2 = 30000; // 30 secund
  await new Promise((resolve) => setTimeout(resolve, pause2));

  // Create a fine-tuning job
  await createFineTuneJob({ ...job, training_file_id: uploadId }, key);
}
async function getFileTextAndSendAsFile(
  jobId: string,
  key: string,
  args: {
    _id: string;
    file?:
      | {
          fileKey: string;
          contentType: string;
        }
      | null
      | undefined;
  },
) {
  const url = await getUrl(args.file?.fileKey);
  const buffer = fetch(url);
  const textContent = await (await buffer).text();

  const upload = await sendTextAsFile(textContent, key);
  if (!upload.id) throw new Error(`Upload error: ${upload.error?.message}`);

  await MongOrb('FineTuneJobsCollection').collection.updateOne(
    { _id: jobId },
    {
      status: FineTuneJobStatus.uploading,
      training_file_id: upload.id,
    },
  );
  return upload.id;
}
