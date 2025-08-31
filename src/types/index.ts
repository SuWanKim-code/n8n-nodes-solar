export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface ChatOptions {
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	stream?: boolean;
	reasoning_effort?: string;
	frequency_penalty?: number;
	presence_penalty?: number;
	response_format?: 'text' | 'json_object' | 'json_schema';
	json_schema?: string;
}

export interface ChatRequestBody {
	model: string;
	messages: ChatMessage[];
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	stream?: boolean;
	reasoning_effort?: string;
	frequency_penalty?: number;
	presence_penalty?: number;
	response_format?: { type: string; json_schema?: object };
}

export interface EmbeddingOptions {
	model?: string;
	input: string | string[];
}

export interface EmbeddingRequestBody {
	model: string;
	input: string | string[];
}

export interface ApiResponse<T = unknown> {
	data?: T;
	error?: {
		message: string;
		code?: string;
		type?: string;
	};
}

export interface ModelInfo {
	id: string;
	name: string;
	description?: string;
	capabilities?: string[];
}

export interface ChatCompletionResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		message: {
			role: string;
			content: string;
		};
		finish_reason: string;
	}>;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export interface EmbeddingResponse {
	data: Array<{
		embedding: number[];
		index: number;
		object: string;
	}>;
	model: string;
	object: string;
	usage: {
		prompt_tokens: number;
		total_tokens: number;
	};
}

// 문서 파싱 관련 타입들
export interface DocumentParsingRequest {
	document: string;
	format?: 'text' | 'markdown' | 'html';
	options?: {
		extractTables?: boolean;
		extractImages?: boolean;
		extractLinks?: boolean;
		language?: string;
	};
}

export interface DocumentParsingResponse {
	content: string;
	metadata?: {
		pages?: number;
		language?: string;
		extractedTables?: Array<{
			table: string[][];
			page: number;
		}>;
		extractedImages?: Array<{
			description: string;
			page: number;
		}>;
		extractedLinks?: Array<{
			url: string;
			text: string;
			page: number;
		}>;
	};
}

// 정보 추출 관련 타입들
export interface InformationExtractionRequest {
	text: string;
	schema: object | string;
	options?: {
		confidence_threshold?: number;
		max_results?: number;
		language?: string;
	};
}

export interface InformationExtractionResponse {
	extracted_data: Record<string, unknown>;
	confidence_scores?: Record<string, number>;
	metadata?: {
		processing_time?: number;
		language?: string;
	};
}

// 에러 응답 타입
export interface ErrorResponse {
	error: {
		message: string;
		code: string;
		type?: string;
		details?: Record<string, unknown>;
	};
	status?: number;
}

// API 에러 타입
export interface ApiError {
	code?: string;
	statusCode?: number;
	message: string;
	details?: Record<string, unknown>;
}

// 타입 가드 함수들
export function isApiError(error: unknown): error is ApiError {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		'message' in error
	);
}

export function isErrorWithStatusCode(error: unknown): error is { statusCode?: number } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'statusCode' in error
	);
}
