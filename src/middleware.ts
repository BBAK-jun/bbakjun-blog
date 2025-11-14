import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
 
// This function can be marked `async` if using `await` inside
export async function middleware() {
  const response = NextResponse.next()

  response.cookies.set('sessionId',  uuidv4(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}
 
// Alternatively, you can use a default export:
// export default function proxy(request: NextRequest) { ... }
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: '/:path*',
}