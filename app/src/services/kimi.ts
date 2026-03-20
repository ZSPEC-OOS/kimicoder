import type { ChatMessage, ToolCall, ToolDefinition, FileNode } from '@/types';

const KIMI_API_BASE = 'https://api.moonshot.cn/v1';
const MODEL = 'kimi-k2.5';

const SYSTEM_PROMPT = `You are Kimi Coder, an expert software engineer and AI coding assistant. Your goal is to help users write, understand, and improve code.

You have access to the following tools:
- read_file(path): Read the content of a file
- write_file(path, content): Write content to a file
- run_command(cmd): Run a shell command
- search_code(query): Search for code patterns in the repository
- commit_changes(message): Commit changes to GitHub
- create_branch(name): Create a new git branch
- create_pull_request(title, body): Create a pull request

When you need to use a tool, respond with a JSON object in this format:
{
  "tool_calls": [
    {
      "name": "tool_name",
      "arguments": { "arg1": "value1", "arg2": "value2" }
    }
  ],
  "explanation": "Your explanation of what you're doing"
}

Guidelines:
1. Always explain your reasoning before showing code
2. When modifying files, show the complete file content or clear diffs
3. Ask clarifying questions when requirements are ambiguous
4. Follow best practices and coding standards
5. Consider edge cases and error handling
6. Write clean, maintainable code with appropriate comments

Response format:
- Start with your reasoning/explanation
- Then provide code blocks with file paths in the format: \`\`\`language:path/to/file\`\`\`
- Use markdown formatting for readability`;

class KimiService {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  async *streamChat(
    messages: ChatMessage[],
    contextFiles?: FileNode[]
  ): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      throw new Error('Kimi API key not configured');
    }

    // Build context from files
    let contextPrompt = '';
    if (contextFiles && contextFiles.length > 0) {
      contextPrompt = '\n\nRelevant files context:\n';
      for (const file of contextFiles) {
        if (file.content) {
          contextPrompt += `\n--- ${file.path} ---\n${file.content}\n`;
        }
      }
    }

    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role,
        content: m.content + (m.role === 'user' ? contextPrompt : '')
      }))
    ];

    const response = await fetch(`${KIMI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: formattedMessages,
        stream: true,
        temperature: 0.3,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${error}`);
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
        if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
        
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async chat(
    messages: ChatMessage[],
    contextFiles?: FileNode[]
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Kimi API key not configured');
    }

    let contextPrompt = '';
    if (contextFiles && contextFiles.length > 0) {
      contextPrompt = '\n\nRelevant files context:\n';
      for (const file of contextFiles) {
        if (file.content) {
          contextPrompt += `\n--- ${file.path} ---\n${file.content}\n`;
        }
      }
    }

    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role,
        content: m.role === 'user' ? m.content + contextPrompt : m.content
      }))
    ];

    const response = await fetch(`${KIMI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: formattedMessages,
        stream: false,
        temperature: 0.3,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // Parse tool calls from AI response
  parseToolCalls(response: string): { toolCalls: ToolCall[]; explanation: string } {
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*"tool_calls"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          toolCalls: parsed.tool_calls || [],
          explanation: parsed.explanation || ''
        };
      }
    } catch (e) {
      // Not valid JSON, treat as regular response
    }
    return { toolCalls: [], explanation: response };
  }

  // Extract code blocks from response
  extractCodeBlocks(response: string): Array<{ language: string; path: string; code: string }> {
    const codeBlocks: Array<{ language: string; path: string; code: string }> = [];
    const regex = /```(\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(response)) !== null) {
      codeBlocks.push({
        language: match[1] || 'plaintext',
        path: match[2] || '',
        code: match[3].trim()
      });
    }

    return codeBlocks;
  }
}

export const kimiService = new KimiService();

// Tool definitions for the agent
export const availableTools: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the content of a file at the given path',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path to the file' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file at the given path',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The path to the file' },
        content: { type: 'string', description: 'The content to write' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'run_command',
    description: 'Run a shell command in the project directory',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The command to run' }
      },
      required: ['command']
    }
  },
  {
    name: 'search_code',
    description: 'Search for code patterns across the repository',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query or pattern' }
      },
      required: ['query']
    }
  },
  {
    name: 'commit_changes',
    description: 'Commit changes to GitHub with a message',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'The commit message' }
      },
      required: ['message']
    }
  },
  {
    name: 'create_branch',
    description: 'Create a new git branch',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The branch name' }
      },
      required: ['name']
    }
  },
  {
    name: 'create_pull_request',
    description: 'Create a pull request',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The PR title' },
        body: { type: 'string', description: 'The PR description' }
      },
      required: ['title', 'body']
    }
  }
];
