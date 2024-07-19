/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Query:{
		getFilePutURL:{
			fileInput:"FileInput"
		},
		getFileURL:{

		},
		styleTemplate:{

		}
	},
	Mutation:{
		createStyleTemplate:{
			style:"CreateStyleTemplate"
		},
		editStyleTemplate:{
			style:"EditStyleTemplate"
		},
		deleteStyleTemplate:{

		},
		generateAPIKey:{
			key:"CreateAPIKey"
		},
		deleteAPIKey:{

		}
	},
	CreateStyleTemplate:{

	},
	EditStyleTemplate:{

	},
	Vars: `scalar.Vars` as const,
	FileInput:{

	},
	TextGenerationTask_Input:{

	},
	ImageGeneration_Input:{

	},
	AladirikImageEdition_Input:{
		scheduler:"SchedulerForAladirik"
	},
	ImageEdition_Input:{
		scheduler:"SchedulerFotTimothybrooks"
	},
	SchedulerFotTimothybrooks: "enum" as const,
	SchedulerForAladirik: "enum" as const,
	Image: `scalar.Image` as const,
	ImageType: "enum" as const,
	PromptFilter:{

	},
	ImageGenerationQuery:{
		anythingv4dot0:{
			input:"ImageGeneration_Input"
		},
		stableDiffusion21:{
			input:"ImageGeneration_Input"
		},
		openJourney:{
			input:"ImageGeneration_Input"
		},
		dalle:{
			input:"ImageGeneration_Input"
		},
		kandinsky2:{
			input:"ImageGeneration_Input"
		},
		swinir:{
			input:"ImageRestoration_Input"
		},
		qr2aiOutline:{
			input:"ImageEdition_Input"
		},
		alaradirikDepthMidas:{
			input:"AladirikImageEdition_Input"
		},
		alaradirikLineart:{
			input:"AladirikImageEdition_Input"
		},
		timothybrooksPix2pix:{
			input:"ImageEdition_Input"
		}
	},
	ImageRestoration_Input:{
		taskType:"TaskType"
	},
	TaskType: "enum" as const,
	ConversationalQuery:{
		chatGPT35Turbo:{
			input:"GPT35_Input"
		},
		llamaV2:{
			input:"LLamaV2Input"
		}
	},
	GPT35_Message:{
		role:"GPT35_Role"
	},
	GPT35_Role: "enum" as const,
	GPT35_Input:{
		messages:"GPT35_Message",
		options:"TextGenerationTask_Input"
	},
	AssetsQuery:{
		images:{
			promptFilter:"PromptFilter"
		},
		removeImage:{

		}
	},
	CreateAPIKey:{

	},
	IsolatedGPT35TurboMutation:{
		createIsolatedContext:{
			input:"CreateIsolatedContext"
		},
		fineTuningIsolatedContext:{

		},
		addDialog:{
			input:"AddDialogInput"
		},
		updateDialog:{
			input:"UpdateDialogInput"
		},
		removeDialog:{

		},
		fineTuningWithFile:{
			file:"FileInput"
		},
		deleteFineTuneModel:{

		},
		updateFineTuneModel:{

		},
		updateIsolatedContext:{
			input:"UpdateIsolatedContext"
		},
		removeIsolatedContext:{

		}
	},
	IsolatedGPT35TurboQuery:{
		retrieveJob:{

		},
		useIsolatedContext:{
			input:"GPT35_Input"
		},
		previewIsolatedContext:{

		},
		chatGPT35TurboInformationFeed:{
			input:"GPT35_Input"
		}
	},
	CreateIsolatedContext:{
		gpt:"GPT35_Input"
	},
	AddDialogInput:{
		messages:"GPT35_Message",
		editedContext:"GPT35_Message"
	},
	UpdateDialogInput:{
		messages:"GPT35_Message",
		editedContext:"GPT35_Message"
	},
	UpdateIsolatedContext:{
		gpt:"GPT35_Input"
	},
	CreateIsolatedNetwork:{

	},
	IsolatedGPTNetworkQuery:{
		createIsolatedNetwork:{
			network:"CreateIsolatedNetwork"
		},
		removeIsolatedNetwork:{

		},
		queryIsolatedNetwork:{
			input:"GPT35_Input"
		},
		updateIsolatedNetwork:{
			network:"UpdateIsolatedNetwork"
		},
		previewIsolatedNetwork:{

		}
	},
	UpdateIsolatedNetwork:{

	},
	FineTuneJobStatus: "enum" as const,
	LLamaV2Input:{
		options:"LLamaV2_Options"
	},
	LLamaV2_Options:{

	}
}

export const ReturnTypes: Record<string,any> = {
	Query:{
		ai:"AIQuery",
		getFilePutURL:"UploadFileResponse",
		getFileURL:"String",
		apiKeys:"APIKey",
		styleTemplate:"StyleTemplate",
		styleTemplates:"StyleTemplate"
	},
	Mutation:{
		createStyleTemplate:"String",
		editStyleTemplate:"Boolean",
		deleteStyleTemplate:"Boolean",
		generateAPIKey:"String",
		deleteAPIKey:"Boolean"
	},
	Vars: `scalar.Vars` as const,
	UploadFileResponse:{
		fileKey:"String",
		putUrl:"String"
	},
	Image: `scalar.Image` as const,
	GeneratedImage:{
		createdAt:"String",
		prompt:"String",
		_id:"String",
		creatorId:"String",
		model:"String",
		url:"String",
		thumbnailUrl:"String",
		placeholderBase64:"String",
		key:"String",
		thumbnailKey:"String",
		imageType:"ImageType"
	},
	StyleTemplate:{
		_id:"String",
		name:"String",
		prompt:"String",
		negative_prompt:"String",
		description:"String",
		variables:"String",
		createdAt:"String"
	},
	ImageGenerationQuery:{
		anythingv4dot0:"Image",
		stableDiffusion21:"Image",
		openJourney:"Image",
		dalle:"Image",
		kandinsky2:"Image",
		swinir:"Image",
		qr2aiOutline:"Image",
		alaradirikDepthMidas:"Image",
		alaradirikLineart:"Image",
		timothybrooksPix2pix:"Image"
	},
	ConversationalQuery:{
		chatGPT35Turbo:"GPT35_Response",
		isolatedGPT35Turbo:"IsolatedGPT35TurboQuery",
		isolatedGPT35TurboMutation:"IsolatedGPT35TurboMutation",
		isolatedNetworkOps:"IsolatedGPTNetworkQuery",
		llamaV2:"String"
	},
	OngoingConversation:{
		messages:"ConversationMessage",
		createdAt:"String",
		_id:"String"
	},
	ConversationMessage:{
		message:"String",
		role:"String",
		createdAt:"String"
	},
	Dialog:{
		_id:"String",
		createdAt:"String",
		updatedAt:"String",
		contextId:"String",
		creatorId:"String",
		dialogName:"String",
		messages:"GPT35_MessageResponse",
		editedContext:"GPT35_MessageResponse"
	},
	TextDocument:{
		content:"String",
		createdAt:"String",
		updatedAt:"String",
		_id:"String"
	},
	GPT35_MessageResponse:{
		content:"String",
		role:"GPT35_Role"
	},
	GPT35_Response:{
		createdAt:"String",
		message:"GPT35_MessageResponse"
	},
	APIKey:{
		name:"String",
		createdAt:"String",
		_id:"String",
		openAiKey:"String",
		replicateKey:"String"
	},
	MongoStored:{
		"...on GeneratedImage": "GeneratedImage",
		"...on StyleTemplate": "StyleTemplate",
		"...on OngoingConversation": "OngoingConversation",
		"...on Dialog": "Dialog",
		"...on TextDocument": "TextDocument",
		"...on APIKey": "APIKey",
		"...on FineTuneJob": "FineTuneJob",
		"...on IsolatedContextNetwork": "IsolatedContextNetwork",
		_id:"String",
		createdAt:"String"
	},
	AIQuery:{
		imageGeneration:"ImageGenerationQuery",
		conversational:"ConversationalQuery",
		assets:"AssetsQuery"
	},
	AssetsQuery:{
		images:"GeneratedImage",
		conversations:"OngoingConversation",
		textDocuments:"TextDocument",
		removeImage:"Boolean"
	},
	IsolatedGPT35TurboMutation:{
		createIsolatedContext:"String",
		fineTuningIsolatedContext:"String",
		addDialog:"String",
		updateDialog:"Boolean",
		removeDialog:"Boolean",
		fineTuningWithFile:"String",
		deleteFineTuneModel:"Boolean",
		updateFineTuneModel:"Boolean",
		updateIsolatedContext:"Boolean",
		removeIsolatedContext:"Boolean"
	},
	IsolatedGPT35TurboQuery:{
		getFineTuneJobs:"FineTuneJob",
		retrieveJob:"FineTuneJob",
		useIsolatedContext:"GPT35_Response",
		previewIsolatedContext:"IsolatedConversationalContext",
		listIsolatedContexts:"IsolatedConversationalContext",
		listDialogs:"Dialog",
		chatGPT35TurboInformationFeed:"GPT35_Response"
	},
	IsolatedConversationalContext:{
		messages:"GPT35_MessageResponse",
		createdAt:"String",
		_id:"String",
		creatorId:"String",
		name:"String",
		options:"TextGenerationTask",
		ftModel:"String",
		testDialogs:"Dialog"
	},
	TextGenerationTask:{
		max_tokens:"Int",
		temperature:"Float",
		top_p:"Float",
		frequency_penalty:"Float",
		presence_penalty:"Float"
	},
	FineTuneJob:{
		_id:"String",
		contextId:"String",
		contextName:"String",
		job_id:"String",
		createdAt:"String",
		training_file_id:"String",
		model_name:"String",
		model_id:"String",
		status:"FineTuneJobStatus",
		org_id:"String",
		n_epochs:"Int",
		job_error:"String"
	},
	IsolatedContextNetwork:{
		contexts:"IsolatedConversationalContext",
		_id:"String",
		creatorId:"String",
		createdAt:"String",
		networks:"IsolatedContextNetwork",
		name:"String",
		system:"String"
	},
	IsolatedGPTNetworkQuery:{
		createIsolatedNetwork:"String",
		removeIsolatedNetwork:"Boolean",
		listIsolatedNetworks:"IsolatedContextNetwork",
		queryIsolatedNetwork:"NetworkResponse",
		updateIsolatedNetwork:"Boolean",
		previewIsolatedNetwork:"IsolatedContextNetwork"
	},
	NetworkResponse:{
		gpt:"GPT35_Response",
		rawResponse:"String"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}