import type {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	INodeExecutionData,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { 
	ChatMessage, 
	ChatOptions, 
	ChatRequestBody,
	ChatCompletionResponse 
} from '../../types';
import { 
	API_ENDPOINTS, 
	SUPPORTED_MODELS, 
	RESPONSE_FORMATS, 
	MESSAGE_ROLES,
	DEFAULT_VALUES 
} from '../../constants';
import { 
	handleApiError, 
	logError, 
	validateRequiredField, 
	validateMessageRole,
	validateJsonSchema,
	createErrorResponse
} from '../../utils/errorHandler';
import { createUpstageApiClient } from '../../utils/apiClient';

export class LmChatUpstage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Upstage Solar LLM',
		name: 'lmChatUpstage',
		icon: 'file:upstage_v2.svg',
		group: ['transform'],
		version: 1,
		description: 'Use Upstage Solar models for chat completions',
		defaults: {
			name: 'Upstage Solar LLM',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'upstageApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{
						name: 'solar-mini',
						value: SUPPORTED_MODELS.SOLAR_MINI,
						description: 'Fast and efficient model for basic tasks',
					},
					{
						name: 'solar-pro',
						value: SUPPORTED_MODELS.SOLAR_PRO,
						description: 'Powerful model for complex tasks',
					},
					{
						name: 'solar-pro2',
						value: SUPPORTED_MODELS.SOLAR_PRO2,
						description: 'Latest and most advanced Solar model',
					},
				],
				default: SUPPORTED_MODELS.SOLAR_MINI,
				description: 'The Solar model to use',
			},
			{
				displayName: 'Messages',
				name: 'messages',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add message',
				options: [
					{
						displayName: 'Message',
						name: 'message',
						values: [
							{
								displayName: 'Role',
								name: 'role',
								type: 'options',
								options: [
									{
										name: 'System',
										value: MESSAGE_ROLES.SYSTEM,
									},
									{
										name: 'User',
										value: MESSAGE_ROLES.USER,
									},
									{
										name: 'Assistant',
										value: MESSAGE_ROLES.ASSISTANT,
									},
								],
								default: MESSAGE_ROLES.USER,
							},
							{
								displayName: 'Content',
								name: 'content',
								type: 'string',
								typeOptions: {
									rows: 2,
								},
								default: '',
								description: 'Message content',
							},
						],
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						default: 0.7,
						typeOptions: {
							minValue: 0,
							maxValue: 2,
							numberPrecision: 1,
						},
						description: 'Controls randomness in output. Higher values make output more random.',
					},
					{
						displayName: 'Max Tokens',
						name: 'max_tokens',
						type: 'number',
						default: 1000,
						typeOptions: {
							minValue: 1,
							maxValue: 4000,
						},
						description: 'Maximum number of tokens to generate',
					},
					{
						displayName: 'Top P',
						name: 'top_p',
						type: 'number',
						default: 0.9,
						typeOptions: {
							minValue: 0,
							maxValue: 1,
							numberPrecision: 2,
						},
						description: 'Nucleus sampling parameter',
					},
					{
						displayName: 'Stream',
						name: 'stream',
						type: 'boolean',
						default: false,
						description: 'Whether to stream the response',
					},
					{
						displayName: 'Reasoning Effort',
						name: 'reasoning_effort',
						type: 'options',
						options: [
							{
								name: 'Low',
								value: 'low',
								description: 'Disable reasoning for faster responses',
							},
							{
								name: 'High',
								value: 'high',
								description: 'Enable reasoning for complex tasks (may increase token usage)',
							},
						],
						default: 'low',
						description: 'Controls the level of reasoning effort. Only applicable to Reasoning models.',
					},
					{
						displayName: 'Frequency Penalty',
						name: 'frequency_penalty',
						type: 'number',
						default: 0,
						typeOptions: {
							minValue: -2,
							maxValue: 2,
							numberPrecision: 2,
						},
						description: 'Controls model tendency to repeat tokens. Positive values reduce repetition, negative values allow more repetition.',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presence_penalty',
						type: 'number',
						default: 0,
						typeOptions: {
							minValue: -2,
							maxValue: 2,
							numberPrecision: 2,
						},
						description: 'Adjusts tendency to include tokens already present. Positive values encourage new ideas, negative values maintain consistency.',
					},
					{
						displayName: 'Response Format',
						name: 'response_format',
						type: 'options',
						options: [
							{
								name: 'Text (Default)',
								value: RESPONSE_FORMATS.TEXT,
								description: 'Standard text response',
							},
							{
								name: 'JSON Object',
								value: RESPONSE_FORMATS.JSON_OBJECT,
								description: 'Generate JSON object (requires "JSON" in prompt)',
							},
							{
								name: 'JSON Schema',
								value: RESPONSE_FORMATS.JSON_SCHEMA,
								description: 'Generate JSON with custom schema (structured outputs)',
							},
						],
						default: RESPONSE_FORMATS.TEXT,
						description: 'Format for model output. JSON formats only work with solar-pro2 model.',
					},
					{
						displayName: 'JSON Schema',
						name: 'json_schema',
						type: 'json',
						displayOptions: {
							show: {
								response_format: ['json_schema'],
							},
						},
						default: '{}',
						description: 'JSON schema for structured outputs when using json_schema format',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const model = this.getNodeParameter('model', i) as string;
				const messages = this.getNodeParameter('messages.message', i, []) as ChatMessage[];
				const options = this.getNodeParameter('options', i, {}) as ChatOptions;

				// Validate messages array
				if (!messages || messages.length === 0) {
					throw new Error('At least one message is required for chat completion');
				}

				// Validate message content
				for (const message of messages) {
					if (!message.content || message.content.trim() === '') {
						throw new Error('All messages must have non-empty content');
					}
					if (!['system', 'user', 'assistant'].includes(message.role)) {
						throw new Error(`Invalid message role: ${message.role}. Must be 'system', 'user', or 'assistant'`);
					}
				}

				// Build request body
				const requestBody: any = {
					model,
					messages,
					...options,
				};

				// Handle response_format properly
				if (options.response_format && options.response_format !== 'text') {
					if (options.response_format === 'json_object') {
						requestBody.response_format = { type: 'json_object' };
					} else if (options.response_format === 'json_schema' && options.json_schema) {
						try {
							const schema = JSON.parse(options.json_schema);
							requestBody.response_format = {
								type: 'json_schema',
								json_schema: schema,
							};
						} catch (error) {
							throw new Error('Invalid JSON schema provided');
						}
					}
					// Remove the raw response_format and json_schema from body
					delete requestBody.json_schema;
				}

				// Make API request
				const requestOptions: IHttpRequestOptions = {
					method: 'POST',
					url: API_ENDPOINTS.CHAT_COMPLETIONS,
					body: requestBody,
					json: true,
				};

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'upstageApi',
					requestOptions,
				);

				// Handle streaming vs non-streaming response
				if (options.stream) {
					// For streaming, we'd need to handle the stream properly
					// For now, return the full response
					returnData.push({
						json: response,
						pairedItem: { item: i },
					});
				} else {
					// Extract the assistant's message
					const choice = response.choices?.[0];
					const content = choice?.message?.content || '';
					
					returnData.push({
						json: {
							content,
							usage: response.usage,
							model: response.model,
							created: response.created,
							full_response: response,
						},
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				
				// Log detailed error information
				console.error('🚫 Upstage Solar LLM Error:', {
					error: errorMessage,
					itemIndex: i,
					timestamp: new Date().toISOString(),
				});

				if (this.continueOnFail()) {
					returnData.push({
						json: { 
							error: errorMessage,
							error_code: (error as any)?.code || 'unknown_error',
							timestamp: new Date().toISOString()
						},
						pairedItem: { item: i },
					});
				} else {
					throw new Error(`Upstage Solar LLM failed for item ${i}: ${errorMessage}`);
				}
			}
		}

		return [returnData];
	}
}
