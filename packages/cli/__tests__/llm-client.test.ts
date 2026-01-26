/**
 * BSR Method - LLM Client Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LLMClient, LLMMessage } from '../lib/llm-client.js';

describe('LLMClient', () => {
  describe('constructor', () => {
    it('should use default claude provider', () => {
      const client = new LLMClient();
      expect(client).toBeDefined();
    });

    it('should accept custom provider', () => {
      const client = new LLMClient({ provider: 'openai' });
      expect(client).toBeDefined();
    });

    it('should accept custom model', () => {
      const client = new LLMClient({ 
        provider: 'claude', 
        model: 'claude-3-opus-20240229' 
      });
      expect(client).toBeDefined();
    });

    it('should accept custom settings', () => {
      const client = new LLMClient({
        provider: 'openai',
        model: 'gpt-4-turbo',
        maxTokens: 8192,
        temperature: 0.5,
      });
      expect(client).toBeDefined();
    });
  });

  describe('complete', () => {
    let client: LLMClient;
    let fetchSpy: any;

    beforeEach(() => {
      client = new LLMClient({ 
        provider: 'claude',
        apiKey: 'test-api-key' 
      });
      
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should send request to Claude API', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Hello, world!' }],
          model: 'claude-sonnet-4-20250514',
          usage: { input_tokens: 10, output_tokens: 5 },
          stop_reason: 'end_turn',
        }),
      });

      const messages: LLMMessage[] = [
        { role: 'user', content: 'Say hello' }
      ];

      const response = await client.complete(messages);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );

      expect(response.content).toBe('Hello, world!');
      expect(response.usage?.inputTokens).toBe(10);
      expect(response.usage?.outputTokens).toBe(5);
    });

    it('should handle API errors', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Invalid API key',
      });

      const messages: LLMMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      await expect(client.complete(messages)).rejects.toThrow('Claude API error (401)');
    });

    it('should include system prompt', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response' }],
          model: 'claude-sonnet-4-20250514',
        }),
      });

      await client.complete(
        [{ role: 'user', content: 'Test' }],
        'You are a helpful assistant'
      );

      const callBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(callBody.system).toBe('You are a helpful assistant');
    });
  });

  describe('ask', () => {
    it('should return content string directly', async () => {
      const client = new LLMClient({ apiKey: 'test-key' });
      
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Simple response' }],
          model: 'claude-sonnet-4-20250514',
        }),
      } as Response);

      const response = await client.ask('Hello');
      expect(response).toBe('Simple response');
    });
  });

  describe('OpenAI provider', () => {
    let client: LLMClient;
    let fetchSpy: any;

    beforeEach(() => {
      client = new LLMClient({ 
        provider: 'openai',
        apiKey: 'test-openai-key' 
      });
      
      fetchSpy = vi.spyOn(global, 'fetch');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should send request to OpenAI API', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'OpenAI response' }, finish_reason: 'stop' }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5 },
        }),
      });

      const response = await client.complete([
        { role: 'user', content: 'Hello' }
      ]);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-openai-key',
          }),
        })
      );

      expect(response.content).toBe('OpenAI response');
    });
  });
});

describe('Message handling', () => {
  it('should filter system messages for Claude', async () => {
    const client = new LLMClient({ apiKey: 'test-key' });
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: 'Response' }],
        model: 'claude-sonnet-4-20250514',
      }),
    } as Response);

    await client.complete([
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'User message' },
    ]);

    const callBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
    // System should be extracted to top-level, not in messages
    expect(callBody.system).toBe('System prompt');
    expect(callBody.messages).toHaveLength(1);
    expect(callBody.messages[0].role).toBe('user');

    vi.restoreAllMocks();
  });
});
