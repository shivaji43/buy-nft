import { NextResponse } from 'next/server';

const MAGIC_EDEN_BASE_URL = 'https://api-mainnet.magiceden.dev/v2';

interface RouteContext {
  params: {
    symbol: string;
  }
}

export async function GET(request: Request, context: RouteContext) {
  // Extract the symbol from the context parameters
  const { symbol } = context.params;

  // Validate if the symbol exists
  if (!symbol || typeof symbol !== 'string') {
    console.error('Invalid or missing symbol parameter.');
    return NextResponse.json(
      { message: 'Collection symbol is required.' },
      { status: 400 } // Bad Request
    );
  }

  const apiUrl = `${MAGIC_EDEN_BASE_URL}/collections/${symbol}/listings`;
  console.log(`Fetching listings for symbol "${symbol}" from: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      // Handle specific errors like 404 (collection not found)
      if (response.status === 404) {
          console.warn(`Collection symbol "${symbol}" not found on Magic Eden.`);
          return NextResponse.json(
              { message: `Collection with symbol "${symbol}" not found.` },
              { status: 404 }
          );
      }
      // Handle other errors
      const errorBody = await response.text();
      console.error(`Error fetching listings for "${symbol}" from Magic Eden API: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json(
        { message: `Failed to fetch listings from Magic Eden: ${response.statusText}` },
        { status: response.status }
      );
    }

    const listingsData = await response.json();
    console.log(`Successfully fetched ${Array.isArray(listingsData) ? listingsData.length : 0} listings for symbol "${symbol}".`);


    return NextResponse.json(listingsData);

  } catch (error) {
    console.error(`Error in /api/listings/${symbol} endpoint:`, error);
    // Check if it's a network error or something else
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json(
      { message: 'Internal Server Error', error: errorMessage },
      { status: 500 }
    );
  }
}
