import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LLMClient } from '../src/lib/llm-client.js';

describe('LLMClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should default to claude provider', () => {
      const client = new LLMClient({ apiKey: 'test-key' });
      expect(client).toBeDefined();
    });

    it('should accept custom provider and model', () => {
      const client = new LLMClient({
        provider: 'openai',
        model: 'gpt-4',
        apiKey: 'test-key',
      });
      expect(client).toBeDefined();
    });
  });

  describe('complete', () => {
    it('should call Claude API with correct format', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'Hello!' }],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

      const client = new LLMClient({ apiKey: 'test-key' });
      const result = await client.complete([{ role: 'user', content: 'Hi' }]);

      expect(result.content).toBe('Hello!');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-key',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

      const client = new LLMClient({ apiKey: 'bad-key' });
      
      await expect(client.complete([{ role: 'user', content: 'Hi' }]))
        .rejects.toThrow();
    });
  });

  describe('ask', () => {
    it('should return string response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'Response text' }],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

      const client = new LLMClient({ apiKey: 'test-key' });
      const result = await client.ask('Hello');

      expect(result).toBe('Response text');
    });
  });

  describe('OpenAI provider', () => {
    it('should call OpenAI API with correct format', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hello from OpenAI!' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 },
        }),
      };

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

      const client = new LLMClient({
        provider: 'openai',
        apiKey: 'test-key',
      });
      const result = await client.complete([{ role: 'user', content: 'Hi' }]);

      expect(result.content).toBe('Hello from OpenAI!');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
          }),
        })
      );
    });
  });
});
