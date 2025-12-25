/**
 * MCP (Model Context Protocol) Client for RAG System
 * Allows AI assistants to interact with the blog content
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export class MCPClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_RAG_URL || 'http://localhost:3002';
  }

  /**
   * List available MCP tools
   */
  async listTools(): Promise<MCPTool[]> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/tools`);
      if (!response.ok) {
        throw new Error('Failed to list MCP tools');
      }
      const data = await response.json();
      return data.tools;
    } catch (error) {
      console.error('Failed to list MCP tools:', error);
      return [];
    }
  }

  /**
   * Invoke an MCP tool
   */
  async invokeTool(toolName: string, arguments_: Record<string, any>): Promise<MCPToolResult> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: toolName,
          arguments: arguments_,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to invoke MCP tool: ${toolName}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Failed to invoke MCP tool ${toolName}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Explain code or query using MCP
   */
  async explain(query: string, code?: string, context?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          code,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to explain');
      }

      const result = await response.json();
      return result.explanation;
    } catch (error) {
      console.error('Failed to explain:', error);
      throw error;
    }
  }

  /**
   * Get pre-defined tools for common operations
   */
  getCommonTools(): MCPTool[] {
    return [
      {
        name: 'search_blog',
        description: 'Search DEV_BBAK blog posts for relevant information',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find relevant blog posts',
            },
            category: {
              type: 'string',
              description: 'Filter by category (e.g., DEV, REACT, JS, etc.)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 5,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'explain_code',
        description: 'Explain code snippets from the blog with additional context',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code snippet to explain',
            },
            context: {
              type: 'string',
              description: 'Additional context for better explanation',
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'find_examples',
        description: 'Find code examples for specific technologies or concepts',
        inputSchema: {
          type: 'object',
          properties: {
            technology: {
              type: 'string',
              description: 'Technology or concept to find examples for',
            },
            use_case: {
              type: 'string',
              description: 'Specific use case or scenario',
            },
          },
          required: ['technology'],
        },
      },
      {
        name: 'get_related_posts',
        description: 'Get blog posts related to a specific topic',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'Topic to find related posts for',
            },
            limit: {
              type: 'number',
              description: 'Number of related posts to return',
              default: 3,
            },
          },
          required: ['topic'],
        },
      },
    ];
  }
}

// Singleton instance
let mcpClient: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClient) {
    mcpClient = new MCPClient();
  }
  return mcpClient;
}
