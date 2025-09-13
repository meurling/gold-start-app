// OpenAI API types
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
}

export interface EmbeddingResponse {
  object: string;
  data: {
    object: string;
    index: number;
    embedding: number[];
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

// Service result types
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// OpenAI Service Class
export class OpenAIService {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('OpenAI API key not provided. Set VITE_OPENAI_API_KEY environment variable.');
    }
  }

  // Set API key dynamically
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Make a prompt request (chat completion)
  async prompt(
    prompt: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemMessage?: string;
    }
  ): Promise<ServiceResult<string>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY environment variable.',
        statusCode: 401
      };
    }

    const messages: OpenAIMessage[] = [];
    
    if (options?.systemMessage) {
      messages.push({
        role: 'system',
        content: options.systemMessage
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const request: ChatCompletionRequest = {
      model: options?.model || 'gpt-3.5-turbo',
      messages,
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as OpenAIError;
        return {
          success: false,
          error: error.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status
        };
      }

      const chatResponse = data as ChatCompletionResponse;
      const content = chatResponse.choices[0]?.message?.content;
      
      if (content) {
        return {
          success: true,
          data: content,
          statusCode: response.status
        };
      } else {
        return {
          success: false,
          error: 'No content in response',
          statusCode: response.status
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 0
      };
    }
  }

  // Create embeddings
  async createEmbeddings(
    input: string | string[],
    options?: {
      model?: string;
    }
  ): Promise<ServiceResult<number[][]>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY environment variable.',
        statusCode: 401
      };
    }

    const request: EmbeddingRequest = {
      model: options?.model || 'text-embedding-ada-002',
      input,
    };

    try {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as OpenAIError;
        return {
          success: false,
          error: error.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status
        };
      }

      const embeddingResponse = data as EmbeddingResponse;
      const embeddings = embeddingResponse.data.map(item => item.embedding);
      
      return {
        success: true,
        data: embeddings,
        statusCode: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 0
      };
    }
  }
}

// Create a singleton instance
export const openaiService = new OpenAIService();

// Export convenience functions
export const prompt = (
  prompt: string, 
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemMessage?: string;
  }
) => openaiService.prompt(prompt, options);

export const createEmbeddings = (
  input: string | string[], 
  options?: {
    model?: string;
  }
) => openaiService.createEmbeddings(input, options);
