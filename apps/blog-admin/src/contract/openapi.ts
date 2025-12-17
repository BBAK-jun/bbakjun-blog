type JsonSchema =
  | { type: 'string'; format?: string; nullable?: boolean }
  | { type: 'number' | 'integer'; minimum?: number; maximum?: number }
  | { type: 'boolean' }
  | { type: 'array'; items: JsonSchema }
  | { type: 'object'; properties: Record<string, JsonSchema>; required?: string[] }
  | { $ref: string };

type OpenApiSpec = {
  openapi: '3.1.0';
  info: { title: string; version: string; description?: string };
  servers: Array<{ url: string; description?: string }>;
  paths: Record<
    string,
    Partial<
      Record<
        'get' | 'post',
        {
          summary?: string;
          description?: string;
          parameters?: Array<{
            name: string;
            in: 'query' | 'header';
            required?: boolean;
            schema: JsonSchema;
          }>;
          requestBody?: {
            required?: boolean;
            content: Record<
              string,
              {
                schema: JsonSchema;
              }
            >;
          };
          responses: Record<
            string,
            {
              description: string;
              content?: Record<string, { schema: JsonSchema }>;
            }
          >;
        }
      >
    >
  >;
  components: {
    schemas: Record<string, JsonSchema>;
    securitySchemes: Record<
      string,
      { type: 'http'; scheme: 'bearer'; bearerFormat?: string }
    >;
  };
};

const ref = (name: string): JsonSchema => ({ $ref: `#/components/schemas/${name}` });

export const openApiSpec: OpenApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'bbakjun blog-admin API',
    version: '1.0.0',
    description: 'Public + admin APIs for blog content, uploads, and newsletter.',
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local dev' },
    { url: 'https://bbakjun-blog-admin.vercel.app', description: 'Production' },
  ],
  components: {
    securitySchemes: {
      legacyApiKey: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'token',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: { error: { type: 'string' } },
        required: ['error'],
      },
      BlobFile: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          pathname: { type: 'string' },
          size: { type: 'number' },
          uploadedAt: { type: 'string' },
          contentType: { type: 'string', nullable: true },
          syncedAt: { type: 'string' },
          lastChecked: { type: 'string' },
          isDeleted: { type: 'boolean' },
          uploadedBy: { type: 'string', nullable: true },
        },
        required: [
          'id',
          'url',
          'pathname',
          'size',
          'uploadedAt',
          'contentType',
          'syncedAt',
          'lastChecked',
          'isDeleted',
          'uploadedBy',
        ],
      },
      BlobFilesResponse: {
        type: 'object',
        properties: {
          files: { type: 'array', items: ref('BlobFile') },
          total: { type: 'number' },
          hasMore: { type: 'boolean' },
        },
        required: ['files', 'total', 'hasMore'],
      },
      BlobSyncStats: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          added: { type: 'number' },
          deleted: { type: 'number' },
          existing: { type: 'number' },
        },
        required: ['total', 'added', 'deleted', 'existing'],
      },
      BlobSyncResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          stats: ref('BlobSyncStats'),
        },
        required: ['message', 'stats'],
      },
      NewsletterSubscribeBody: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          source: { type: 'string' },
        },
        required: ['email'],
      },
      NewsletterUnsubscribeBody: {
        type: 'object',
        properties: { token: { type: 'string' } },
        required: ['token'],
      },
    },
  },
  paths: {
    '/api/openapi.json': {
      get: {
        summary: 'OpenAPI JSON',
        responses: {
          '200': { description: 'OpenAPI document' },
        },
      },
    },

    // v1 (preferred)
    '/api/v1/blob-files': {
      get: {
        summary: 'List cached blob files (public)',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 1000 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Blob files list',
            content: { 'application/json': { schema: ref('BlobFilesResponse') } },
          },
          '400': {
            description: 'Invalid query',
            content: { 'application/json': { schema: ref('ErrorResponse') } },
          },
          '500': {
            description: 'Server error',
            content: { 'application/json': { schema: ref('ErrorResponse') } },
          },
        },
      },
    },
    '/api/v1/blob-files/admin': {
      get: {
        summary: 'List cached blob files (admin)',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 1000 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'autoSync', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          '200': {
            description: 'Blob files list',
            content: { 'application/json': { schema: ref('BlobFilesResponse') } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: ref('ErrorResponse') } },
          },
          '400': {
            description: 'Invalid query',
            content: { 'application/json': { schema: ref('ErrorResponse') } },
          },
          '500': {
            description: 'Server error',
            content: { 'application/json': { schema: ref('ErrorResponse') } },
          },
        },
      },
    },
    '/api/v1/blob-files/admin/sync': {
      post: {
        summary: 'Sync blob files to DB (admin)',
        responses: {
          '200': {
            description: 'Sync completed',
            content: { 'application/json': { schema: ref('BlobSyncResponse') } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: ref('ErrorResponse') } },
          },
          '500': {
            description: 'Server error',
            content: { 'application/json': { schema: ref('ErrorResponse') } },
          },
        },
      },
    },
    '/api/v1/newsletter/subscribe': {
      post: {
        summary: 'Subscribe newsletter',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ref('NewsletterSubscribeBody') } },
        },
        responses: {
          '200': { description: 'OK' },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: ref('ErrorResponse') } },
          },
          '500': {
            description: 'Server error',
            content: { 'application/json': { schema: ref('ErrorResponse') } },
          },
        },
      },
    },
    '/api/v1/newsletter/unsubscribe': {
      post: {
        summary: 'Unsubscribe newsletter',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ref('NewsletterUnsubscribeBody') } },
        },
        responses: {
          '200': { description: 'OK' },
          '400': {
            description: 'Validation error',
            content: { 'application/json': { schema: ref('ErrorResponse') } },
          },
          '404': {
            description: 'Not found',
            content: { 'application/json': { schema: ref('ErrorResponse') } },
          },
          '500': {
            description: 'Server error',
            content: { 'application/json': { schema: ref('ErrorResponse') } },
          },
        },
      },
    },

    // legacy aliases (kept)
    '/api/public/blob-files': {
      get: {
        summary: '[Legacy] List cached blob files (public)',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 1000 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Blob files list',
            content: { 'application/json': { schema: ref('BlobFilesResponse') } },
          },
        },
      },
    },
  },
};
