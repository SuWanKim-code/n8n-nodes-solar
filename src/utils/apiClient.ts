import type { IHttpRequestOptions, IExecuteFunctions } from 'n8n-workflow';
import type { 
	ChatRequestBody, 
	EmbeddingRequestBody, 
	ChatCompletionResponse, 
	EmbeddingResponse,
	ApiResponse 
} from '../types';
import { API_ENDPOINTS, DEFAULT_VALUES } from '../constants';
import { getHttpProxyAgent } from './httpProxyAgent';
import { handleApiError, logError } from './errorHandler';

export class UpstageApiClient {
	constructor(
		private apiKey: string,
		private helpers: IExecuteFunctions['helpers'],
		private baseUrl: string = 'https://api.upstage.ai',
		private timeout: number = DEFAULT_VALUES.REQUEST_TIMEOUT,
	) {}

	private async makeRequest<T>(
		endpoint: string,
		options: Partial<IHttpRequestOptions>,
		context: string,
	): Promise<T> {
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: endpoint,
			timeout: this.timeout,
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.apiKey}`,
				...options.headers,
			},
		};

		// httpAgent는 별도로 설정 (n8n의 IHttpRequestOptions에 없는 속성)
		const agent = getHttpProxyAgent();
		if (agent) {
			(requestOptions as any).httpAgent = agent;
		}

		try {
			const response = await this.helpers.httpRequest(requestOptions);
			return response as T;
		} catch (error) {
			logError(this as any, error, context);
			handleApiError(error, context);
		}
	}

	async chatCompletions(
		requestBody: ChatRequestBody,
		context: string = 'ChatCompletions',
	): Promise<ChatCompletionResponse> {
		return this.makeRequest<ChatCompletionResponse>(
			API_ENDPOINTS.CHAT_COMPLETIONS,
			{
				body: requestBody,
				json: true,
			},
			context,
		);
	}

	async embeddings(
		requestBody: EmbeddingRequestBody,
		context: string = 'Embeddings',
	): Promise<EmbeddingResponse> {
		return this.makeRequest<EmbeddingResponse>(
			API_ENDPOINTS.EMBEDDINGS,
			{
				body: requestBody,
				json: true,
			},
			context,
		);
	}

	async getModels(context: string = 'GetModels'): Promise<ApiResponse> {
		return this.makeRequest<ApiResponse>(
			API_ENDPOINTS.MODELS,
			{
				method: 'GET',
			},
			context,
		);
	}

	async documentParsing(
		requestBody: any,
		context: string = 'DocumentParsing',
	): Promise<ApiResponse> {
		return this.makeRequest<ApiResponse>(
			API_ENDPOINTS.DOCUMENT_PARSING,
			{
				body: requestBody,
				json: true,
			},
			context,
		);
	}

	async informationExtraction(
		requestBody: any,
		context: string = 'InformationExtraction',
	): Promise<ApiResponse> {
		return this.makeRequest<ApiResponse>(
			API_ENDPOINTS.INFORMATION_EXTRACTION,
			{
				body: requestBody,
				json: true,
			},
			context,
		);
	}

	// 헬퍼 메서드들
	setTimeout(timeout: number): void {
		this.timeout = timeout;
	}

	setBaseUrl(baseUrl: string): void {
		this.baseUrl = baseUrl;
	}

	getBaseUrl(): string {
		return this.baseUrl;
	}

	// 스트리밍 응답 처리 (향후 구현)
	async streamChatCompletions(
		requestBody: ChatRequestBody,
		onChunk: (chunk: any) => void,
		context: string = 'StreamChatCompletions',
	): Promise<void> {
		// 스트리밍 구현은 향후 추가
		throw new Error('Streaming not yet implemented');
	}
}

// 팩토리 함수
export function createUpstageApiClient(
	apiKey: string,
	helpers: IExecuteFunctions['helpers'],
	options?: {
		baseUrl?: string;
		timeout?: number;
	},
): UpstageApiClient {
	return new UpstageApiClient(
		apiKey,
		helpers,
		options?.baseUrl,
		options?.timeout,
	);
}
