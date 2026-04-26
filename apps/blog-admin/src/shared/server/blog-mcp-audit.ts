export interface BlogMcpAuditEvent {
  actor: string;
  tool: string;
  pathname?: string;
  dryRun?: boolean;
  success: boolean;
  startedAt: string;
  durationMs: number;
  error?: string;
}

export function auditBlogMcpTool(event: BlogMcpAuditEvent) {
  const payload = {
    ...event,
    component: 'blog-mcp',
  };

  if (event.success) {
    console.info('[BlogMCP Audit]', JSON.stringify(payload));
  } else {
    console.warn('[BlogMCP Audit]', JSON.stringify(payload));
  }
}
