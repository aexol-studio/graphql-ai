export type Vars = unknown
export type Image = unknown

export enum SchedulerFotTimothybrooks {
  DDIM = "DDIM",
  K_EULER = "K_EULER",
  DPMSolverMultistep = "DPMSolverMultistep",
  K_EULER_ANCESTRAL = "K_EULER_ANCESTRAL",
  PNDM = "PNDM",
  KLMS = "KLMS"
}
export enum SchedulerForAladirik {
  DDIM = "DDIM",
  DPMSolverMultistep = "DPMSolverMultistep",
  HeunDiscrete = "HeunDiscrete",
  KarrasDPM = "KarrasDPM",
  K_EULER_ANCESTRAL = "K_EULER_ANCESTRAL",
  K_EULER = "K_EULER",
  PNDM = "PNDM",
  LMSDiscrete = "LMSDiscrete"
}
export enum ImageType {
  GENERATED = "GENERATED",
  UPSCALED = "UPSCALED"
}
export enum TaskType {
  RESOLUTION_LARGE = "RESOLUTION_LARGE",
  RESOLUTION_MEDIUM = "RESOLUTION_MEDIUM"
}
export enum GPT35_Role {
  system = "system",
  user = "user",
  assistant = "assistant"
}
export enum FineTuneJobStatus {
  uploading = "uploading",
  validating_files = "validating_files",
  created = "created",
  queued = "queued",
  running = "running",
  succeeded = "succeeded",
  error = "error"
}

export interface CreateStyleTemplate {
  name: string;
  prompt: string;
  negative_prompt: string;
  description?: string | undefined;
  variables: Array<string>;
}
export interface EditStyleTemplate {
  name?: string | undefined;
  prompt?: string | undefined;
  negative_prompt?: string | undefined;
  description?: string | undefined;
  variables?: Array<string> | undefined;
}
export interface FileInput {
  fileKey: string;
  contentType: string;
}
export interface TextGenerationTask_Input {
  max_tokens?: number | undefined;
  temperature?: number | undefined;
  top_p?: number | undefined;
  frequency_penalty?: number | undefined;
  presence_penalty?: number | undefined;
}
export interface ImageGeneration_Input {
  prompt: string;
  negative_prompt?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  seed?: number | undefined;
}
export interface AladirikImageEdition_Input {
  prompt: string;
  negative_prompt?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  random_seed?: number | undefined;
  image?: string | undefined;
  scheduler?: SchedulerForAladirik | undefined;
  max_tokens?: number | undefined;
}
export interface ImageEdition_Input {
  prompt: string;
  negative_prompt?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  seed?: number | undefined;
  image?: string | undefined;
  scheduler?: SchedulerFotTimothybrooks | undefined;
  max_tokens?: number | undefined;
}
export interface PromptFilter {
  from?: string | undefined;
  to?: string | undefined;
  query?: string | undefined;
}
export interface ImageRestoration_Input {
  name: string;
  fileURL: string;
  taskType: TaskType;
}
export interface GPT35_Message {
  content: string;
  role: GPT35_Role;
}
export interface GPT35_Input {
  messages: Array<GPT35_Message>;
  user?: string | undefined;
  options?: TextGenerationTask_Input | undefined;
}
export interface CreateAPIKey {
  name: string;
  openAiKey: string;
  replicateKey: string;
}
export interface CreateIsolatedContext {
  gpt: GPT35_Input;
  name: string;
}
export interface AddDialogInput {
  messages: Array<GPT35_Message>;
  editedContext?: Array<GPT35_Message> | undefined;
  dialogName: string;
  contextId: string;
}
export interface UpdateDialogInput {
  messages?: Array<GPT35_Message> | undefined;
  editedContext?: Array<GPT35_Message> | undefined;
  dialogName?: string | undefined;
  contextId?: string | undefined;
}
export interface UpdateIsolatedContext {
  gpt?: GPT35_Input | undefined;
  name?: string | undefined;
}
export interface CreateIsolatedNetwork {
  contexts?: Array<string> | undefined;
  networks?: Array<string> | undefined;
  name: string;
  system?: string | undefined;
}
export interface UpdateIsolatedNetwork {
  contexts?: Array<string> | undefined;
  networks?: Array<string> | undefined;
  name?: string | undefined;
  system?: string | undefined;
}
export interface LLamaV2Input {
  userMessage: string;
  options?: LLamaV2_Options | undefined;
}
export interface LLamaV2_Options {
  max_length?: number | undefined;
  temperature?: number | undefined;
  top_p?: number | undefined;
  repetition_penalty?: number | undefined;
}

export type Models = {
  ['Query']: {
    ai: {
      args: Record<string, never>;
    };
    getFilePutURL: {
      args: {
        fileInput: FileInput;
      };
    };
    getFileURL: {
      args: {
        fileKey: string;
      };
    };
    apiKeys: {
      args: Record<string, never>;
    };
    styleTemplate: {
      args: {
        styleTemplateId: string;
      };
    };
    styleTemplates: {
      args: Record<string, never>;
    };
  };
  ['Mutation']: {
    createStyleTemplate: {
      args: {
        style: CreateStyleTemplate;
      };
    };
    editStyleTemplate: {
      args: {
        style: EditStyleTemplate;
        _id: string;
      };
    };
    deleteStyleTemplate: {
      args: {
        _id: string;
      };
    };
    generateAPIKey: {
      args: {
        key: CreateAPIKey;
      };
    };
    deleteAPIKey: {
      args: {
        _id: string;
      };
    };
  };
  ['UploadFileResponse']: {
    fileKey: {
      args: Record<string, never>;
    };
    putUrl: {
      args: Record<string, never>;
    };
  };
  ['GeneratedImage']: {
    createdAt: {
      args: Record<string, never>;
    };
    prompt: {
      args: Record<string, never>;
    };
    _id: {
      args: Record<string, never>;
    };
    creatorId: {
      args: Record<string, never>;
    };
    model: {
      args: Record<string, never>;
    };
    url: {
      args: Record<string, never>;
    };
    thumbnailUrl: {
      args: Record<string, never>;
    };
    placeholderBase64: {
      args: Record<string, never>;
    };
    key: {
      args: Record<string, never>;
    };
    thumbnailKey: {
      args: Record<string, never>;
    };
    imageType: {
      args: Record<string, never>;
    };
  };
  ['StyleTemplate']: {
    _id: {
      args: Record<string, never>;
    };
    name: {
      args: Record<string, never>;
    };
    prompt: {
      args: Record<string, never>;
    };
    negative_prompt: {
      args: Record<string, never>;
    };
    description: {
      args: Record<string, never>;
    };
    variables: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
  };
  ['ImageGenerationQuery']: {
    anythingv4dot0: {
      args: {
        input: ImageGeneration_Input;
      };
    };
    stableDiffusion21: {
      args: {
        input: ImageGeneration_Input;
      };
    };
    openJourney: {
      args: {
        input: ImageGeneration_Input;
      };
    };
    dalle: {
      args: {
        input: ImageGeneration_Input;
      };
    };
    kandinsky2: {
      args: {
        input: ImageGeneration_Input;
      };
    };
    swinir: {
      args: {
        input: ImageRestoration_Input;
      };
    };
    qr2aiOutline: {
      args: {
        input: ImageEdition_Input;
      };
    };
    alaradirikDepthMidas: {
      args: {
        input: AladirikImageEdition_Input;
      };
    };
    alaradirikLineart: {
      args: {
        input: AladirikImageEdition_Input;
      };
    };
    timothybrooksPix2pix: {
      args: {
        input: ImageEdition_Input;
      };
    };
  };
  ['ConversationalQuery']: {
    chatGPT35Turbo: {
      args: {
        input: GPT35_Input;
      };
    };
    isolatedGPT35Turbo: {
      args: Record<string, never>;
    };
    isolatedGPT35TurboMutation: {
      args: Record<string, never>;
    };
    isolatedNetworkOps: {
      args: Record<string, never>;
    };
    llamaV2: {
      args: {
        input: LLamaV2Input;
      };
    };
  };
  ['OngoingConversation']: {
    messages: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
    _id: {
      args: Record<string, never>;
    };
  };
  ['ConversationMessage']: {
    message: {
      args: Record<string, never>;
    };
    role: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
  };
  ['Dialog']: {
    _id: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
    updatedAt: {
      args: Record<string, never>;
    };
    contextId: {
      args: Record<string, never>;
    };
    creatorId: {
      args: Record<string, never>;
    };
    dialogName: {
      args: Record<string, never>;
    };
    messages: {
      args: Record<string, never>;
    };
    editedContext: {
      args: Record<string, never>;
    };
  };
  ['TextDocument']: {
    content: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
    updatedAt: {
      args: Record<string, never>;
    };
    _id: {
      args: Record<string, never>;
    };
  };
  ['GPT35_MessageResponse']: {
    content: {
      args: Record<string, never>;
    };
    role: {
      args: Record<string, never>;
    };
  };
  ['GPT35_Response']: {
    createdAt: {
      args: Record<string, never>;
    };
    message: {
      args: Record<string, never>;
    };
  };
  ['APIKey']: {
    name: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
    _id: {
      args: Record<string, never>;
    };
    openAiKey: {
      args: Record<string, never>;
    };
    replicateKey: {
      args: Record<string, never>;
    };
  };
  ['AIQuery']: {
    imageGeneration: {
      args: Record<string, never>;
    };
    conversational: {
      args: Record<string, never>;
    };
    assets: {
      args: Record<string, never>;
    };
  };
  ['AssetsQuery']: {
    images: {
      args: {
        creatorId?: string | undefined;
        promptFilter?: PromptFilter | undefined;
      };
    };
    conversations: {
      args: Record<string, never>;
    };
    textDocuments: {
      args: Record<string, never>;
    };
    removeImage: {
      args: {
        _id: string;
      };
    };
  };
  ['IsolatedGPT35TurboMutation']: {
    createIsolatedContext: {
      args: {
        input: CreateIsolatedContext;
      };
    };
    fineTuningIsolatedContext: {
      args: {
        _id: string;
      };
    };
    addDialog: {
      args: {
        input: AddDialogInput;
      };
    };
    updateDialog: {
      args: {
        _id: string;
        input: UpdateDialogInput;
      };
    };
    removeDialog: {
      args: {
        _id: string;
      };
    };
    fineTuningWithFile: {
      args: {
        _id: string;
        file?: FileInput | undefined;
      };
    };
    deleteFineTuneModel: {
      args: {
        _id: string;
      };
    };
    updateFineTuneModel: {
      args: {
        _id: string;
        model_name: string;
      };
    };
    updateIsolatedContext: {
      args: {
        input: UpdateIsolatedContext;
        _id: string;
      };
    };
    removeIsolatedContext: {
      args: {
        _id: string;
      };
    };
  };
  ['IsolatedGPT35TurboQuery']: {
    getFineTuneJobs: {
      args: Record<string, never>;
    };
    retrieveJob: {
      args: {
        _id?: string | undefined;
      };
    };
    useIsolatedContext: {
      args: {
        input: GPT35_Input;
        useOwnModel?: boolean | undefined;
        contextId: string;
        dialogId?: string | undefined;
      };
    };
    previewIsolatedContext: {
      args: {
        _id: string;
      };
    };
    listIsolatedContexts: {
      args: Record<string, never>;
    };
    listDialogs: {
      args: Record<string, never>;
    };
    chatGPT35TurboInformationFeed: {
      args: {
        input: GPT35_Input;
      };
    };
  };
  ['IsolatedConversationalContext']: {
    messages: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
    _id: {
      args: Record<string, never>;
    };
    creatorId: {
      args: Record<string, never>;
    };
    name: {
      args: Record<string, never>;
    };
    options: {
      args: Record<string, never>;
    };
    ftModel: {
      args: Record<string, never>;
    };
    testDialogs: {
      args: Record<string, never>;
    };
  };
  ['TextGenerationTask']: {
    max_tokens: {
      args: Record<string, never>;
    };
    temperature: {
      args: Record<string, never>;
    };
    top_p: {
      args: Record<string, never>;
    };
    frequency_penalty: {
      args: Record<string, never>;
    };
    presence_penalty: {
      args: Record<string, never>;
    };
  };
  ['FineTuneJob']: {
    _id: {
      args: Record<string, never>;
    };
    contextId: {
      args: Record<string, never>;
    };
    contextName: {
      args: Record<string, never>;
    };
    job_id: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
    training_file_id: {
      args: Record<string, never>;
    };
    model_name: {
      args: Record<string, never>;
    };
    model_id: {
      args: Record<string, never>;
    };
    status: {
      args: Record<string, never>;
    };
    org_id: {
      args: Record<string, never>;
    };
    n_epochs: {
      args: Record<string, never>;
    };
    job_error: {
      args: Record<string, never>;
    };
  };
  ['IsolatedContextNetwork']: {
    contexts: {
      args: Record<string, never>;
    };
    _id: {
      args: Record<string, never>;
    };
    creatorId: {
      args: Record<string, never>;
    };
    createdAt: {
      args: Record<string, never>;
    };
    networks: {
      args: Record<string, never>;
    };
    name: {
      args: Record<string, never>;
    };
    system: {
      args: Record<string, never>;
    };
  };
  ['IsolatedGPTNetworkQuery']: {
    createIsolatedNetwork: {
      args: {
        network: CreateIsolatedNetwork;
      };
    };
    removeIsolatedNetwork: {
      args: {
        _id: string;
      };
    };
    listIsolatedNetworks: {
      args: Record<string, never>;
    };
    queryIsolatedNetwork: {
      args: {
        _id: string;
        input: GPT35_Input;
        testMode?: boolean | undefined;
      };
    };
    updateIsolatedNetwork: {
      args: {
        _id: string;
        network: UpdateIsolatedNetwork;
      };
    };
    previewIsolatedNetwork: {
      args: {
        _id: string;
      };
    };
  };
  ['NetworkResponse']: {
    gpt: {
      args: Record<string, never>;
    };
    rawResponse: {
      args: Record<string, never>;
    };
  };
};

export interface Query {
  ai: AIQuery;
  getFilePutURL: UploadFileResponse;
  getFileURL?: string | undefined;
  apiKeys?: Array<APIKey> | undefined;
  styleTemplate?: StyleTemplate | undefined;
  styleTemplates?: Array<StyleTemplate> | undefined;
}
export interface Mutation {
  createStyleTemplate: string;
  editStyleTemplate?: boolean | undefined;
  deleteStyleTemplate?: boolean | undefined;
  generateAPIKey: string;
  deleteAPIKey?: boolean | undefined;
}
export interface UploadFileResponse {
  fileKey: string;
  putUrl: string;
}
export interface GeneratedImage {
  createdAt: string;
  prompt: string;
  _id: string;
  creatorId?: string | undefined;
  model?: string | undefined;
  url?: string | undefined;
  thumbnailUrl?: string | undefined;
  placeholderBase64?: string | undefined;
  key: string;
  thumbnailKey?: string | undefined;
  imageType?: ImageType | undefined;
}
export interface StyleTemplate {
  _id: string;
  name: string;
  prompt: string;
  negative_prompt: string;
  description?: string | undefined;
  variables: Array<string>;
  createdAt: string;
}
export interface ImageGenerationQuery {
  anythingv4dot0: Image;
  stableDiffusion21: Image;
  openJourney: Image;
  dalle: Image;
  kandinsky2: Image;
  swinir: Image;
  qr2aiOutline: Image;
  alaradirikDepthMidas: Image;
  alaradirikLineart: Image;
  timothybrooksPix2pix: Image;
}
export interface ConversationalQuery {
  chatGPT35Turbo: GPT35_Response;
  isolatedGPT35Turbo: IsolatedGPT35TurboQuery;
  isolatedGPT35TurboMutation: IsolatedGPT35TurboMutation;
  isolatedNetworkOps: IsolatedGPTNetworkQuery;
  llamaV2?: string | undefined;
}
export interface OngoingConversation {
  messages: Array<ConversationMessage>;
  createdAt: string;
  _id: string;
}
export interface ConversationMessage {
  message: string;
  role: string;
  createdAt: string;
}
export interface Dialog {
  _id: string;
  createdAt: string;
  updatedAt: string;
  contextId: string;
  creatorId?: string | undefined;
  dialogName: string;
  messages?: Array<GPT35_MessageResponse> | undefined;
  editedContext?: Array<GPT35_MessageResponse> | undefined;
}
export interface TextDocument {
  content: string;
  createdAt: string;
  updatedAt: string;
  _id: string;
}
export interface GPT35_MessageResponse {
  content: string;
  role: GPT35_Role;
}
export interface GPT35_Response {
  createdAt: string;
  message: GPT35_MessageResponse;
}
export interface APIKey {
  name: string;
  createdAt: string;
  _id: string;
  openAiKey: string;
  replicateKey: string;
}
export interface AIQuery {
  imageGeneration: ImageGenerationQuery;
  conversational: ConversationalQuery;
  assets: AssetsQuery;
}
export interface AssetsQuery {
  images?: Array<GeneratedImage> | undefined;
  conversations?: Array<OngoingConversation> | undefined;
  textDocuments?: Array<TextDocument> | undefined;
  removeImage?: boolean | undefined;
}
export interface IsolatedGPT35TurboMutation {
  createIsolatedContext: string;
  fineTuningIsolatedContext: string;
  addDialog: string;
  updateDialog: boolean;
  removeDialog: boolean;
  fineTuningWithFile: string;
  deleteFineTuneModel: boolean;
  updateFineTuneModel: boolean;
  updateIsolatedContext?: boolean | undefined;
  removeIsolatedContext?: boolean | undefined;
}
export interface IsolatedGPT35TurboQuery {
  getFineTuneJobs?: Array<FineTuneJob> | undefined;
  retrieveJob: FineTuneJob;
  useIsolatedContext: GPT35_Response;
  previewIsolatedContext: IsolatedConversationalContext;
  listIsolatedContexts: Array<IsolatedConversationalContext>;
  listDialogs?: Array<Dialog> | undefined;
  chatGPT35TurboInformationFeed: GPT35_Response;
}
export interface IsolatedConversationalContext {
  messages: Array<GPT35_MessageResponse>;
  createdAt: string;
  _id: string;
  creatorId?: string | undefined;
  name: string;
  options?: TextGenerationTask | undefined;
  ftModel?: string | undefined;
  testDialogs?: Array<Dialog> | undefined;
}
export interface TextGenerationTask {
  max_tokens?: number | undefined;
  temperature?: number | undefined;
  top_p?: number | undefined;
  frequency_penalty?: number | undefined;
  presence_penalty?: number | undefined;
}
export interface FineTuneJob {
  _id: string;
  contextId: string;
  contextName?: string | undefined;
  job_id?: string | undefined;
  createdAt: string;
  training_file_id: string;
  model_name?: string | undefined;
  model_id?: string | undefined;
  status: FineTuneJobStatus;
  org_id?: string | undefined;
  n_epochs?: number | undefined;
  job_error?: string | undefined;
}
export interface IsolatedContextNetwork {
  contexts?: Array<IsolatedConversationalContext> | undefined;
  _id: string;
  creatorId?: string | undefined;
  createdAt: string;
  networks?: Array<IsolatedContextNetwork> | undefined;
  name: string;
  system?: string | undefined;
}
export interface IsolatedGPTNetworkQuery {
  createIsolatedNetwork?: string | undefined;
  removeIsolatedNetwork?: boolean | undefined;
  listIsolatedNetworks?: Array<IsolatedContextNetwork> | undefined;
  queryIsolatedNetwork: NetworkResponse;
  updateIsolatedNetwork?: boolean | undefined;
  previewIsolatedNetwork: IsolatedContextNetwork;
}
export interface NetworkResponse {
  gpt?: GPT35_Response | undefined;
  rawResponse?: string | undefined;
}
