/**
 * BSR Method - LLM Client
 * Supports Claude (Anthropic) and OpenAI APIs
 */

import fs from 'fs-extra';
import path from 'path';

export interface LLMConfig {
  provider: 'claude' | 'openai';
  model: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  stopReason?: string;
}

const DEFAULT_MODELS = {
  claude: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
};

const DEFAULT_MAX_TOKENS = 4096;

export class LLMClient {
  private config: LLMConfig;

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = {
      provider: config.provider || 'claude',
      model: config.model || DEFAULT_MODELS[config.provider || 'claude'],
      apiKey: config.apiKey,
      maxTokens: config.maxTokens || DEFAULT_MAX_TOKENS,
      temperature: config.temperature ?? 0.7,
    };
  }

  /**
   * Load API key from environment or .env file
   */
  private async getApiKey(): Promise<string> {
    if (this.config.apiKey) {
      return this.config.apiKey;
    }

    // Check environment variables
    const envVar = this.config.provider === 'claude' 
      ? 'ANTHROPIC_API_KEY' 
      : 'OPENAI_API_KEY';
    
    if (process.env[envVar]) {
      return process.env[envVar]!;
    }

    // Try loading from .env file
    const envPath = path.join(process.cwd(), '.env');
    if (await fs.pathExists(envPath)) {
      const envContent = await fs.readFile(envPath, 'utf-8');
      const match = envContent.match(new RegExp(`${envVar}=(.+)`));
      if (match) {
        return match[1].trim();
      }
    }

    throw new Error(
      `API key not found. Set ${envVar} environment variable or add it to .env file.`
    );
  }

  /**
   * Send a completion request to the LLM
   */
  async complete(messages: LLMMessage[], systemPrompt?: string): Promise<LLMResponse> {
    const apiKey = await this.getApiKey();

    if (this.config.provider === 'claude') {
      return this.completeClaude(messages, systemPrompt, apiKey);
    } else {
      return this.completeOpenAI(messages, systemPrompt, apiKey);
    }
  }

  /**
   * Claude API completion
   */
  private async completeClaude(
    messages: LLMMessage[],
    systemPrompt: string | undefined,
    apiKey: string
  ): Promise<LLMResponse> {
    const url = 'https://api.anthropic.com/v1/messages';

    // Convert messages to Claude format (no system role in messages)
    const claudeMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Extract system from messages if not provided
    const system = systemPrompt || 
      messages.find(m => m.role === 'system')?.content ||
      'You are an expert software developer helping implement tasks.';

    const body = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system,
      messages: claudeMessages,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error (${response.status}): ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0]?.text || '',
      model: data.model,
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      },
      stopReason: data.stop_reason,
    };
  }

  /**
   * OpenAI API completion
   */
  private async completeOpenAI(
    messages: LLMMessage[],
    systemPrompt: string | undefined,
    apiKey: string
  ): Promise<LLMResponse> {
    const url = 'https://api.openai.com/v1/chat/completions';

    // Build messages array
    const openaiMessages: Array<{ role: string; content: string }> = [];

    // Add system prompt
    if (systemPrompt) {
      openaiMessages.push({ role: 'system', content: systemPrompt });
    }

    // Add conversation messages
    for (const msg of messages) {
      openaiMessages.push({ role: msg.role, content: msg.content });
    }

    const body = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: openaiMessages,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
      stopReason: data.choices[0]?.finish_reason,
    };
  }

  /**
   * Simple single-prompt completion
   */
  async ask(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await this.complete(
      [{ role: 'user', content: prompt }],
      systemPrompt
    );
    return response.content;
  }

  /**
   * Stream completion (returns async generator)
   */
  async *stream(messages: LLMMessage[], systemPrompt?: string): AsyncGenerator<string> {
    const apiKey = await this.getApiKey();

    if (this.config.provider === 'claude') {
      yield* this.streamClaude(messages, systemPrompt, apiKey);
    } else {
      yield* this.streamOpenAI(messages, systemPrompt, apiKey);
    }
  }

  /**
   * Claude streaming
   */
  private async *streamClaude(
    messages: LLMMessage[],
    systemPrompt: string | undefined,
    apiKey: string
  ): AsyncGenerator<string> {
    const url = 'https://api.anthropic.com/v1/messages';

    const claudeMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const system = systemPrompt || 
      messages.find(m => m.role === 'system')?.content ||
      'You are an expert software developer helping implement tasks.';

    const body = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system,
      messages: claudeMessages,
      stream: true,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error (${response.status}): ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield parsed.delta.text;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * OpenAI streaming
   */
  private async *streamOpenAI(
    messages: LLMMessage[],
    systemPrompt: string | undefined,
    apiKey: string
  ): AsyncGenerator<string> {
    const url = 'https://api.openai.com/v1/chat/completions';

    const openaiMessages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      openaiMessages.push({ role: 'system', content: systemPrompt });
    }
    for (const msg of messages) {
      openaiMessages.push({ role: msg.role, content: msg.content });
    }

    const body = {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: openaiMessages,
      stream: true,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

/**
 * Create LLM client from BSR config
 */
export async function createLLMClient(configPath?: string): Promise<LLMClient> {
  const bsrConfigPath = configPath || path.join(process.cwd(), '.bsr/config.yaml');
  
  let provider: 'claude' | 'openai' = 'claude';
  let model: string | undefined;

  if (await fs.pathExists(bsrConfigPath)) {
    const yaml = await import('yaml');
    const config = yaml.parse(await fs.readFile(bsrConfigPath, 'utf-8'));
    
    const llmDefault = config.llm?.default?.toLowerCase() || 'claude';
    provider = llmDefault.includes('openai') || llmDefault.includes('gpt') ? 'openai' : 'claude';
    model = config.llm?.model;
  }

  return new LLMClient({ provider, model });
}

export default LLMClient;
