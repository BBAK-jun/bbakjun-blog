/**
 * Admin API Client
 *
 * Centralized API client for blog-admin with automatic authentication.
 * Handles API key management and provides typed methods for all endpoints.
 */

export interface FileData {
  rawContent: string;
  htmlContent: string;
  frontMatter: Record<string, any> | null;
  metadata: {
    pathname: string;
    size: number;
    uploadedAt: string;
    url: string;
  };
}

export interface BlobFile {
  filename: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  url: string;
}

export interface Session {
  authenticated: boolean;
  apiKey: string;
}

class AdminApiClient {
  private apiKey: string | null = null;

  /**
   * Get API key from session
   * Caches the key for subsequent requests
   */
  async getApiKey(): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }

    const response = await fetch("/api/admin/session", {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Session expired. Please login again.");
    }

    const session: Session = await response.json();
    this.apiKey = session.apiKey;
    return session.apiKey;
  }

  /**
   * Clear cached API key
   * Call this on logout or session expiry
   */
  clearApiKey() {
    this.apiKey = null;
  }

  /**
   * Authenticated fetch wrapper
   * Automatically adds Authorization header
   */
  private async authenticatedFetch(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const apiKey = await this.getApiKey();

    return fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  /**
   * Get file content and metadata
   */
  async getFile(pathname: string): Promise<FileData> {
    const response = await this.authenticatedFetch(
      `/api/admin/file/content?pathname=${encodeURIComponent(pathname)}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch file");
    }

    return response.json();
  }

  /**
   * Update file content
   */
  async updateFile(pathname: string, content: string): Promise<void> {
    const response = await this.authenticatedFetch(
      `/api/admin/file?pathname=${encodeURIComponent(pathname)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update file");
    }
  }

  /**
   * Delete file
   */
  async deleteFile(pathname: string): Promise<void> {
    const response = await this.authenticatedFetch(
      `/api/admin/file?pathname=${encodeURIComponent(pathname)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete file");
    }
  }

  /**
   * List files
   */
  async listFiles(limit = 100): Promise<BlobFile[]> {
    const response = await this.authenticatedFetch(
      `/api/admin/files?limit=${limit}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch files");
    }

    const data = await response.json();
    return data.files || [];
  }

  /**
   * Preview markdown content
   */
  async previewMarkdown(content: string): Promise<string> {
    const response = await this.authenticatedFetch("/api/admin/file/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate preview");
    }

    const data = await response.json();
    return data.htmlContent;
  }
}

// Export singleton instance
export const apiClient = new AdminApiClient();
