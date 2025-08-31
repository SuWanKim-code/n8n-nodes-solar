export const API_ENDPOINTS = {
	CHAT_COMPLETIONS: 'https://api.upstage.ai/v1/chat/completions',
	EMBEDDINGS: 'https://api.upstage.ai/v1/embeddings',
	MODELS: 'https://api.upstage.ai/v1/models',
	DOCUMENT_PARSING: 'https://api.upstage.ai/v1/parse',
	INFORMATION_EXTRACTION: 'https://api.upstage.ai/v1/extract',
} as const;

export const SUPPORTED_MODELS = {
	SOLAR_MINI: 'solar-mini',
	SOLAR_PRO: 'solar-pro',
	SOLAR_PRO2: 'solar-pro2',
} as const;

export const SUPPORTED_EMBEDDING_MODELS = {
	EMBEDDING_QUERY: 'embedding-query',
	EMBEDDING_PASSAGE: 'embedding-passage',
} as const;

export const RESPONSE_FORMATS = {
	TEXT: 'text',
	JSON_OBJECT: 'json_object',
	JSON_SCHEMA: 'json_schema',
} as const;

export const MESSAGE_ROLES = {
	SYSTEM: 'system',
	USER: 'user',
	ASSISTANT: 'assistant',
} as const;

export const DEFAULT_VALUES = {
	TEMPERATURE: 0.7,
	MAX_TOKENS: 1000,
	TOP_P: 1.0,
	REQUEST_TIMEOUT: 30000,
} as const;

export const ERROR_CODES = {
	MISSING_REQUIRED_FIELD: 'missing_required_field',
	INVALID_MESSAGE_ROLE: 'invalid_message_role',
	INVALID_JSON_SCHEMA: 'invalid_json_schema',
	API_REQUEST_FAILED: 'api_request_failed',
	MODEL_NOT_SUPPORTED: 'model_not_supported',
	INVALID_FIELD_TYPE: 'invalid_field_type',
	EMPTY_ARRAY: 'empty_array',
	EMPTY_STRING: 'empty_string',
	VALUE_OUT_OF_RANGE: 'value_out_of_range',
} as const;

export const VALIDATION_RULES = {
	MAX_MESSAGES: 100,
	MAX_CONTENT_LENGTH: 4000,
	MAX_EMBEDDING_INPUTS: 100,
	MAX_TOTAL_TOKENS: 204800,
} as const;
