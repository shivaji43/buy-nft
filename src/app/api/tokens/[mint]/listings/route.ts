import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const pathParts = pathname.split('/');
  const mint = pathParts[pathParts.length - 2];
  
  if (!mint) {
    return NextResponse.json(
      { error: 'Missing mint address parameter' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api-mainnet.magiceden.dev/v2/tokens/${mint}/listings`,
      {
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Magic Eden API returned status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching NFT listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT listings' },
      { status: 500 }
    );
  }
}