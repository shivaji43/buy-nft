import { NextResponse } from 'next/server';

const ALLOWED_TIME_RANGES = ['1h', '1d', '7d', '30d'];
const DEFAULT_TIME_RANGE = '1d';
const MAGIC_EDEN_API_URL = 'https://api-mainnet.magiceden.dev/v2/marketplace/popular_collections';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let timeRange = searchParams.get('timeRange') || DEFAULT_TIME_RANGE;

  // Validate the time range parameter
  if (!ALLOWED_TIME_RANGES.includes(timeRange)) {
    console.warn(`Invalid timeRange received: ${timeRange}. Defaulting to ${DEFAULT_TIME_RANGE}.`);
    timeRange = DEFAULT_TIME_RANGE; 
  }

  const apiUrl = `${MAGIC_EDEN_API_URL}?timeRange=${timeRange}`;

  console.log(`Workspaceing popular collections from Magic Eden API: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      // Log detailed error from Magic Eden if possible
      const errorBody = await response.text();
      console.error(`Error fetching from Magic Eden API: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json(
        { message: `Failed to fetch data from Magic Eden: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`Successfully fetched ${Array.isArray(data) ? data.length : 0} collections for timeRange: ${timeRange}`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in /api/collections endpoint:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}