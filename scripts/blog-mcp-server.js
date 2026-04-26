#!/usr/bin/env node

/**
 * Thin stdio MCP adapter for the blog-admin Blog MCP HTTP API.
 *
 * Required env:
 * - BLOG_MCP_ENDPOINT: e.g. https://admin.example.com/rpc/blog-mcp
 * - BLOG_MCP_API_KEY: scoped key issued for this MCP client
 *
 * This adapter intentionally does not know Vercel Blob credentials. It only
 * forwards MCP tool calls to blog-admin, where authz and Blob writes happen.
 */

const endpoint = process.env.BLOG_MCP_ENDPOINT;
const apiKey = process.env.BLOG_MCP_API_KEY;

if (!endpoint || !apiKey) {
  console.error('BLOG_MCP_ENDPOINT and BLOG_MCP_API_KEY are required');
  process.exit(1);
}

const baseUrl = endpoint.replace(/\/+$/g, '');
let inputBuffer = Buffer.alloc(0);

function send(message) {
  const payload = Buffer.from(JSON.stringify(message), 'utf8');
  process.stdout.write(`Content-Length: ${payload.byteLength}\r\n\r\n`);
  process.stdout.write(payload);
}

function sendResult(id, result) {
  if (id === undefined || id === null) return;
  send({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message, data) {
  if (id === undefined) return;
  send({ jsonrpc: '2.0', id, error: { code, message, data } });
}

async function blogMcpFetch(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'message' in body ? body.message : text;
    const error = new Error(message || `Blog MCP request failed with ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

function toMcpTool(tool) {
  return {
    name: tool.name,
    description: `${tool.description} (required scope: ${tool.requiredScope})`,
    inputSchema:
      tool.inputSchema && typeof tool.inputSchema === 'object'
        ? tool.inputSchema
        : { type: 'object', additionalProperties: true, properties: {} },
  };
}

async function handleRequest(request) {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return sendResult(id, {
      protocolVersion: params?.protocolVersion ?? '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'bbak-blog-mcp', version: '1.0.0' },
    });
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'tools/list') {
    const result = await blogMcpFetch('/tools');
    return sendResult(id, { tools: result.tools.map(toMcpTool) });
  }

  if (method === 'tools/call') {
    const name = params?.name;
    if (!name) {
      return sendError(id, -32602, 'params.name is required');
    }

    const result = await blogMcpFetch('/invoke', {
      method: 'POST',
      body: JSON.stringify({ tool: name, arguments: params?.arguments ?? {} }),
    });
    return sendResult(id, result);
  }

  return sendError(id, -32601, `Method not found: ${method}`);
}

function processBuffer() {
  while (true) {
    const headerEnd = inputBuffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) return;

    const header = inputBuffer.subarray(0, headerEnd).toString('utf8');
    const contentLengthMatch = header.match(/content-length:\s*(\d+)/i);
    if (!contentLengthMatch) {
      sendError(null, -32600, 'Missing Content-Length header');
      inputBuffer = inputBuffer.subarray(headerEnd + 4);
      continue;
    }

    const contentLength = Number(contentLengthMatch[1]);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + contentLength;
    if (inputBuffer.byteLength < messageEnd) return;

    const rawMessage = inputBuffer.subarray(messageStart, messageEnd).toString('utf8');
    inputBuffer = inputBuffer.subarray(messageEnd);

    let request;
    try {
      request = JSON.parse(rawMessage);
    } catch (error) {
      sendError(null, -32700, 'Parse error', error instanceof Error ? error.message : String(error));
      continue;
    }

    handleRequest(request).catch(error => {
      sendError(request.id ?? null, -32000, error.message, {
        status: error.status,
        body: error.body,
      });
    });
  }
}

process.stdin.on('data', chunk => {
  inputBuffer = Buffer.concat([inputBuffer, Buffer.from(chunk)]);
  processBuffer();
});
