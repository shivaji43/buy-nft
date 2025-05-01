import { NextResponse } from 'next/server';

const MAGIC_EDEN_BASE_URL = 'https://api-mainnet.magiceden.dev/v2';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname; 
  const pathParts = pathname.split('/'); 
  const symbol = pathParts[pathParts.length - 1];

  if (!symbol || typeof symbol !== 'string') {
    console.error('API Route Error: Invalid or missing token symbol parameter.');
    return NextResponse.json(
      { message: 'Token symbol address is required.' },
      { status: 400 }
    );
  }

  const apiUrl = `${MAGIC_EDEN_BASE_URL}/tokens/${symbol}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
      next: { revalidate: 3600 } 
    });

    if (!response.ok) {
      let errorBody = 'Could not read error body.';
      try {
          errorBody = await response.text();
      } catch (readError) {
          console.error(`API Route Warning: Failed to read error body for non-OK response (${response.status}).`, readError);
      }
      console.error(`API Route Error: Magic Eden token API request failed for symbol "${symbol}" with status ${response.status}. URL: ${apiUrl}. Body: ${errorBody}`);

      if (response.status === 404) {
          return NextResponse.json(
              { message: `Token with symbol address "${symbol}" not found.` },
              { status: 404 }
          );
      }
      return NextResponse.json(
        { message: `Failed to fetch token details from Magic Eden. Status: ${response.status}` },
        { status: response.status }
      );
    }

    const nftData = await response.json();
    return NextResponse.json(nftData);

  } catch (error: unknown) {
    console.error(`API Route Fatal Error: An unexpected error occurred while fetching NFT details for symbol "${symbol}". URL: ${apiUrl}`, error);
    let errorMessage = 'An unexpected internal server error occurred.';
    if (error instanceof SyntaxError) {
        errorMessage = 'Failed to parse response from Magic Eden token API (Invalid JSON).';
    } else if (error instanceof Error) {
        errorMessage = `Network or fetch error: ${error.message}`;
    }
    return NextResponse.json(
      { message: 'Internal Server Error', error: errorMessage },
      { status: 500 }
    );
  }
}
