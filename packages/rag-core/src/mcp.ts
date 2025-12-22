/**
 * MCP (Model Context Protocol) Client Implementation
 * Claude Code 및 기타 AI assistants와의 통신을 위한 클라이언트
 */

export interface MCPTool {
  name: string
  description: string
  parameters: Record<string, any>
}

export interface MCPInvokeRequest {
  tool: string
  arguments: Record<string, any>
  context?: {
    conversationId?: string
    userId?: string
  }
}

export interface MCPInvokeResponse {
  tool: string
  result: any
  context?: {
    timestamp: string
    executionTime: number
  }
}

export class MCPClient {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:3002') {
    this.baseUrl = baseUrl
  }

  /**
   * Get available MCP tools
   */
  async getTools(): Promise<MCPTool[]> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/tools`)
      if (!response.ok) {
        throw new Error(`Failed to fetch tools: ${response.statusText}`)
      }
      const data = await response.json() as { tools?: MCPTool[] }
      return data.tools || []
    } catch (error) {
      console.error('Failed to get MCP tools:', error)
      return []
    }
  }

  /**
   * Invoke an MCP tool
   */
  async invoke(request: MCPInvokeRequest): Promise<MCPInvokeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Tool invocation failed: ${response.statusText}`)
      }

      return await response.json() as MCPInvokeResponse
    } catch (error) {
      console.error(`Failed to invoke tool ${request.tool}:`, error)
      throw error
    }
  }

  /**
   * Explain code or query
   */
  async explain(query: string, code?: string, context?: string): Promise<any> {
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
    })

    if (!response.ok) {
      throw new Error(`Explain failed: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Search blog content
   */
  async searchBlogContent(query: string, options?: {
    category?: string
    tags?: string[]
    limit?: number
  }): Promise<any> {
    return this.invoke({
      tool: 'search_blog',
      arguments: {
        query,
        category: options?.category,
        tags: options?.tags,
        limit: options?.limit || 5,
      },
    })
  }

  /**
   * Explain code snippet
   */
  async explainCode(code: string, context?: string): Promise<any> {
    return this.invoke({
      tool: 'explain_code',
      arguments: {
        code,
        context,
      },
    })
  }

  /**
   * Find code examples
   */
  async findExamples(technology: string, useCase?: string): Promise<any> {
    return this.invoke({
      tool: 'find_examples',
      arguments: {
        technology,
        use_case: useCase,
      },
    })
  }

  /**
   * Get related posts for a topic
   */
  async getRelatedPosts(topic: string, limit?: number): Promise<any> {
    return this.invoke({
      tool: 'get_related_posts',
      arguments: {
        topic,
        limit: limit || 3,
      },
    })
  }
}

// Singleton instance
let mcpClient: MCPClient | null = null

export function getMCPClient(baseUrl?: string): MCPClient {
  if (!mcpClient) {
    mcpClient = new MCPClient(baseUrl)
  }
  return mcpClient
}

// Predefined tools for easy access
export const MCP_TOOLS = {
  SEARCH_BLOG: 'search_blog',
  EXPLAIN_CODE: 'explain_code',
  FIND_EXAMPLES: 'find_examples',
  GET_RELATED_POSTS: 'get_related_posts',
} as const

// Helper function to create tool schemas
export function createMCPToolSchema(
  name: string,
  description: string,
  parameters: Record<string, any>
): MCPTool {
  return {
    name,
    description,
    parameters,
  }
}