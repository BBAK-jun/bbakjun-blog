# Newsletter Feature Documentation

## Overview

The newsletter feature provides email subscription functionality for the blog, allowing readers to subscribe to new content updates. It includes:

- Email subscription/unsubscription
- Admin dashboard for subscriber management
- Resend email service integration
- CORS support for cross-origin subscriptions

## Architecture

```
Blog App (localhost:3000)
    ↓ POST /api/newsletter/subscribe
    ↓ (CORS enabled)
Blog Admin API (localhost:3001)
    ↓
    ↓ Store subscriber
    ↓
PostgreSQL (Neon)
    ↓
    ↓ Send welcome email
    ↓
Resend Email Service
```

## Database Schema

### Subscriber Model

**Location**: `apps/blog-admin/prisma/schema.prisma`

```prisma
model Subscriber {
  id              String    @id @default(cuid())
  email           String    @unique
  subscribedAt    DateTime  @default(now())
  unsubscribedAt  DateTime?
  isActive        Boolean   @default(true)
  unsubscribeToken String   @unique @default(cuid())
  source          String?   // e.g., "footer", "popup", "blog-post"

  @@index([email])
  @@index([isActive])
  @@map("subscribers")
}
```

### Fields

- **id**: Unique identifier (cuid)
- **email**: Subscriber email address (unique)
- **subscribedAt**: Timestamp of subscription
- **unsubscribedAt**: Timestamp of unsubscription (null if active)
- **isActive**: Boolean flag for active subscriptions
- **unsubscribeToken**: Secure token for unsubscribe links
- **source**: Optional tracking field for subscription source

## API Endpoints

### 1. Subscribe

**Endpoint**: `POST /api/newsletter/subscribe`

**Request**:

```json
{
  "email": "user@example.com",
  "source": "footer" // optional
}
```

**Response** (Success):

```json
{
  "success": true,
  "message": "구독해주셔서 감사합니다! 이메일을 확인해주세요."
}
```

**Response** (Already subscribed):

```json
{
  "success": true,
  "message": "이미 구독 중이신 이메일입니다."
}
```

**Response** (Error):

```json
{
  "success": false,
  "error": "Invalid email address"
}
```

**Features**:

- Email validation
- Duplicate subscription handling (reactivates if previously unsubscribed)
- Sends welcome email via Resend
- CORS enabled for blog app
- Source tracking

**CORS Headers**:

```typescript
{
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BLOG_URL || 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

### 2. Unsubscribe

**Endpoint**: `POST /api/newsletter/unsubscribe`

**Request**:

```json
{
  "token": "clxxxxx_unsubscribe_token"
}
```

**Response** (Success):

```json
{
  "success": true,
  "message": "구독이 해지되었습니다."
}
```

**Response** (Error):

```json
{
  "success": false,
  "error": "Invalid token"
}
```

**Features**:

- Token-based unsubscription (secure)
- Soft delete (marks `isActive: false` and sets `unsubscribedAt`)
- No authentication required (uses token)

### 3. List Subscribers (Admin)

**Endpoint**: `GET /api/newsletter/subscribers`

**Authentication**: Requires Auth.js session with ADMIN or SUPER_ADMIN role

**Query Parameters**:

- `limit` (number, default: 100): Maximum subscribers to return
- `offset` (number, default: 0): Pagination offset
- `activeOnly` (boolean, default: true): Filter active subscribers only

**Response**:

```json
{
  "subscribers": [
    {
      "id": "clxxxxx",
      "email": "user@example.com",
      "subscribedAt": "2024-12-17T12:00:00Z",
      "unsubscribedAt": null,
      "isActive": true,
      "source": "footer"
    }
  ],
  "total": 150,
  "hasMore": true
}
```

## Email Integration (Resend)

### Setup

1. **Get Resend API Key**:
   - Sign up at [resend.com](https://resend.com)
   - Create API key
   - Add to environment variables: `RESEND_API_KEY=re_xxxxx`

2. **Domain Verification**:
   - Add domain to Resend dashboard
   - Configure DNS records (SPF, DKIM, DMARC)

### DNS Configuration (Gabia Example)

For domain `dev-bbak.site`:

| Type | Name               | Value                                              | TTL  |
| ---- | ------------------ | -------------------------------------------------- | ---- |
| TXT  | @                  | `v=spf1 include:_spf.resend.com ~all`              | 3600 |
| TXT  | resend.\_domainkey | `[DKIM value from Resend]`                         | 3600 |
| TXT  | \_dmarc            | `v=DMARC1; p=none; rua=mailto:dmarc@dev-bbak.site` | 3600 |

**Note**: Wait 24-48 hours for DNS propagation.

### Welcome Email Template

**Location**: `apps/blog-admin/src/app/api/newsletter/subscribe/route.ts`

```typescript
await resend.emails.send({
  from: 'DEV_BBAK 블로그 <noreply@dev-bbak.site>',
  to: email,
  subject: 'DEV_BBAK 블로그 구독을 환영합니다! 🎉',
  html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>구독해주셔서 감사합니다!</h2>
      <p>DEV_BBAK 블로그의 새로운 글을 이메일로 받아보실 수 있습니다.</p>
      <p><a href="${process.env.NEXT_PUBLIC_BLOG_URL}">블로그 방문하기</a></p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #666;">
        구독을 원하지 않으시면
        <a href="${adminUrl}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}">
          여기를 클릭
        </a>
        하여 해지하실 수 있습니다.
      </p>
    </div>
  `,
});
```

### Error Handling

- **No API Key**: Feature disabled gracefully (no email sent, but subscription stored)
- **Domain Not Verified**: Error thrown with message `"The {domain} domain is not verified"`
- **Invalid Email**: Resend validates and rejects invalid formats

## Frontend Components

### NewsletterSubscribe Component

**Location**: `apps/blog/src/components/NewsletterSubscribe.tsx`

**Props**:

- `source` (string, default: "footer"): Tracking source
- `compact` (boolean, default: false): Compact layout

**Features**:

- Email validation
- Loading states
- Success/error messages
- Compact and full-width layouts

**Usage**:

```tsx
// Full layout (with icon and description)
<NewsletterSubscribe source="homepage" />

// Compact layout (inline form)
<NewsletterSubscribe source="footer" compact />
```

## Environment Variables

### Blog App (`apps/blog`)

```bash
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001  # Development
NEXT_PUBLIC_ADMIN_URL=https://admin.your-domain.com  # Production
```

### Blog-Admin App (`apps/blog-admin`)

```bash
# Email Service
RESEND_API_KEY=re_xxxxx

# CORS
NEXT_PUBLIC_BLOG_URL=http://localhost:3000  # Development
NEXT_PUBLIC_BLOG_URL=https://your-domain.com  # Production

# Database (required for Subscriber model)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

## Migration

Run Prisma migration to create Subscriber table:

```bash
cd apps/blog-admin
npx prisma migrate dev --name add_subscriber_model
npx prisma generate
```

## Common Issues

### CORS Errors

**Issue**: Blog app gets CORS error when subscribing

**Cause**: Missing CORS headers or incorrect `NEXT_PUBLIC_BLOG_URL`

**Fix**:

1. Verify `NEXT_PUBLIC_BLOG_URL` matches blog domain
2. Ensure API route includes CORS headers (see above)
3. Add OPTIONS handler for preflight requests

### Email Not Received

**Issue**: Subscription succeeds but no email arrives

**Causes**:

1. Domain not verified in Resend
2. DNS records not propagated
3. Email in spam folder
4. Invalid RESEND_API_KEY

**Fix**:

1. Check Resend dashboard for domain status
2. Wait 24-48h for DNS propagation
3. Check spam/junk folders
4. Verify API key is correct and active

### Duplicate Subscriptions

**Issue**: User tries to subscribe twice

**Behavior**:

- If `isActive: true`: Returns "이미 구독 중이신 이메일입니다."
- If `isActive: false`: Reactivates subscription and sends new welcome email

This is handled automatically by the upsert logic in the subscribe endpoint.

## Admin Dashboard

**Location**: `apps/blog-admin/src/app/admin/subscribers/page.tsx` (to be implemented)

**Features to Implement**:

- List all subscribers with pagination
- Search by email
- Filter by active/inactive status
- Export to CSV
- Manual subscriber management (add/remove)
- View subscription source analytics

## Security Considerations

1. **Unsubscribe Tokens**:
   - Unique cuid per subscriber
   - No authentication required (token-based)
   - Cannot be guessed or enumerated

2. **Admin-Only Endpoints**:
   - Subscriber list requires authentication
   - Role-based access control (ADMIN/SUPER_ADMIN)

3. **Rate Limiting**:
   - Consider adding rate limiting to prevent spam subscriptions
   - Vercel's built-in DDoS protection helps

4. **Email Validation**:
   - Client-side HTML5 validation
   - Server-side validation via email format regex
   - Resend validates email deliverability

## Future Enhancements

1. **Email Campaign System**:
   - Send newsletters to all active subscribers
   - Rich text editor for email content
   - Schedule sending

2. **Double Opt-In**:
   - Send confirmation email before activating subscription
   - Prevents spam subscriptions

3. **Subscriber Preferences**:
   - Choose email frequency (immediate, daily, weekly)
   - Topic preferences
   - Email format (HTML vs plain text)

4. **Analytics**:
   - Open rate tracking
   - Click-through rate
   - Subscription source analytics
   - Unsubscribe reasons

5. **A/B Testing**:
   - Test different email templates
   - Subject line optimization

## Testing

### Local Testing

1. Start both apps:

   ```bash
   pnpm dev        # Blog on :3000
   pnpm dev:admin  # Blog-admin on :3001
   ```

2. Subscribe via blog UI:
   - Go to http://localhost:3000
   - Find newsletter form (footer or dedicated page)
   - Enter email and submit

3. Check email (if Resend configured):
   - Use real email address
   - Check inbox for welcome email
   - Test unsubscribe link

### Database Testing

```sql
-- Check subscribers
SELECT * FROM subscribers ORDER BY "subscribedAt" DESC;

-- Count active subscribers
SELECT COUNT(*) FROM subscribers WHERE "isActive" = true;

-- Recent subscriptions
SELECT email, "subscribedAt", source
FROM subscribers
WHERE "isActive" = true
ORDER BY "subscribedAt" DESC
LIMIT 10;
```

## API Testing (cURL)

### Subscribe

```bash
curl -X POST http://localhost:3001/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","source":"api-test"}'
```

### Unsubscribe

```bash
curl -X POST http://localhost:3001/api/newsletter/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"token":"clxxxxx_your_token"}'
```

### List Subscribers (with auth session)

```bash
curl http://localhost:3001/api/newsletter/subscribers?limit=10 \
  -H "Cookie: your-session-cookie"
```
