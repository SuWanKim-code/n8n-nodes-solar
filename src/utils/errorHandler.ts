import type { IExecuteFunctions, ISupplyDataFunctions } from 'n8n-workflow';
import { ERROR_CODES } from '../constants';
import { isApiError, isErrorWithStatusCode } from '../types';

export class UpstageApiError extends Error {
	constructor(
		message: string,
		public readonly code?: string,
		public readonly statusCode?: number,
		public readonly context?: string,
	) {
		super(message);
		this.name = 'UpstageApiError';
	}
}

export function handleApiError(error: unknown, context: string, itemIndex?: number): never {
	if (error instanceof UpstageApiError) {
		throw error;
	}
	
	if (isApiError(error)) {
		throw new UpstageApiError(
			`${context}: ${error.message}`,
			error.code || ERROR_CODES.API_REQUEST_FAILED,
			error.statusCode,
			context,
		);
	}
	
	throw new UpstageApiError(
		`${context}: Unknown error occurred`,
		ERROR_CODES.API_REQUEST_FAILED,
		undefined,
		context,
	);
}

export function logError(
	executeFunctions: IExecuteFunctions | ISupplyDataFunctions,
	error: unknown,
	context: string,
	itemIndex?: number,
): void {
	const errorMessage = error instanceof Error ? error.message : 'Unknown error';
	const errorCode = isApiError(error) ? error.code : ERROR_CODES.API_REQUEST_FAILED;
	
	// n8n 환경에서 안전하게 로깅
	try {
		if (typeof console !== 'undefined' && console.error) {
			console.error(`🚫 ${context} Error:`, {
				error: errorMessage,
				error_code: errorCode,
				itemIndex,
				timestamp: new Date().toISOString(),
				context,
			});
		}
	} catch (error) {
		// 로깅 실패 시 무시
	}
}

export function validateRequiredField(value: unknown, fieldName: string, context: string): void {
	if (value === undefined || value === null || value === '') {
		throw new UpstageApiError(
			`${fieldName} is required`,
			ERROR_CODES.MISSING_REQUIRED_FIELD,
			undefined,
			context,
		);
	}
}

export function validateMessageRole(role: string, context: string): void {
	const validRoles = ['system', 'user', 'assistant'];
	if (!validRoles.includes(role)) {
		throw new UpstageApiError(
			`Invalid message role: ${role}. Must be one of: ${validRoles.join(', ')}`,
			ERROR_CODES.INVALID_MESSAGE_ROLE,
			undefined,
			context,
		);
	}
}

export function validateJsonSchema(schema: string, context: string): object {
	try {
		return JSON.parse(schema);
	} catch (error) {
		throw new UpstageApiError(
			'Invalid JSON schema provided',
			ERROR_CODES.INVALID_JSON_SCHEMA,
			undefined,
			context,
		);
	}
}

export function validateModelSupport(model: string, supportedModels: string[], context: string): void {
	if (!supportedModels.includes(model)) {
		throw new UpstageApiError(
			`Model '${model}' is not supported. Supported models: ${supportedModels.join(', ')}`,
			ERROR_CODES.MODEL_NOT_SUPPORTED,
			undefined,
			context,
		);
	}
}

export function createErrorResponse(
	error: unknown,
	context: string,
	itemIndex?: number,
): { error: string; error_code: string; timestamp: string; context: string } {
	const errorMessage = error instanceof Error ? error.message : 'Unknown error';
	const errorCode = isApiError(error) ? (error.code || ERROR_CODES.API_REQUEST_FAILED) : ERROR_CODES.API_REQUEST_FAILED;
	
	return {
		error: errorMessage,
		error_code: errorCode,
		timestamp: new Date().toISOString(),
		context,
	};
}
