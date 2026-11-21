import { generateRssXml, rssResponse } from '@/lib/rss';

export async function GET() {
  return rssResponse(await generateRssXml());
}
