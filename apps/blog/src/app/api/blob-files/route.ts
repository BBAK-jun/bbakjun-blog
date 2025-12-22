import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/rpc';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '1000';
    const offset = searchParams.get('offset') || '0';
    const searchTerm = searchParams.get('search') || '';

    const response = await client.api.v1['blob-files'].$get({
      query: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        search: searchTerm,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch blob files');
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching blob files:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}