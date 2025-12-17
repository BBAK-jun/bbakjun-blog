import { AppType } from 'blog-admin/rpc'
import { hc } from 'hono/client'

export const client = hc<AppType>(process.env.NEXT_PUBLIC_ADMIN_URL!)