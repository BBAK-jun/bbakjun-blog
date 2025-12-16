import { getAllPosts } from '@repo/content'

/**
 * RSS Feed for blog posts
 * Accessible at /feed.xml
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const posts = await getAllPosts()

  // Get latest 20 posts for the feed
  const recentPosts = posts.slice(0, 20)

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DEV_BBAK 블로그</title>
    <link>${baseUrl}</link>
    <description>프론트엔드 개발자 박준형의 기술 블로그</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${recentPosts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.frontMatter.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <description><![CDATA[${post.frontMatter.description}]]></description>
      <pubDate>${new Date(post.frontMatter.date).toUTCString()}</pubDate>
      <guid>${baseUrl}/blog/${post.slug}</guid>
      <author>${post.frontMatter.author}</author>
      ${post.frontMatter.tags?.map((tag) => `<category>${tag}</category>`).join('\n      ') || ''}
    </item>`
      )
      .join('\n')}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
