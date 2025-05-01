import { NextResponse } from 'next/server';

const MAGIC_EDEN_BASE_URL = 'https://api-mainnet.magiceden.dev/v2';

const ALLOWED_SORT_FIELDS = ['listPrice', 'updatedAt'];
const ALLOWED_SORT_DIRECTIONS = ['asc', 'desc'];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const pathname = url.pathname; 
  const pathParts = pathname.split('/'); 
  const symbol = pathParts[pathParts.length - 1];

  if (!symbol || typeof symbol !== 'string') {
    return NextResponse.json({ message: 'Collection symbol is required.' }, { status: 400 });
  }

  const query = new URLSearchParams();

  const offset = parseInt(searchParams.get('offset') || '0', 10);
  if (!isNaN(offset) && offset >= 0) {
    query.set('offset', String(offset));
  } else {
    query.set('offset', '0');
  }

  const limit = parseInt(searchParams.get('limit') || '20', 10);
  if (!isNaN(limit) && limit >= 1 && limit <= 100) {
    query.set('limit', String(limit));
  } else {
    query.set('limit', '20');
  }

  const minPrice = searchParams.get('min_price');
  if (minPrice && !isNaN(parseFloat(minPrice)) && parseFloat(minPrice) >= 0) {
    query.set('min_price', minPrice);
  }

  const maxPrice = searchParams.get('max_price');
  if (maxPrice && !isNaN(parseFloat(maxPrice)) && parseFloat(maxPrice) >= 0) {
    query.set('max_price', maxPrice);
  }

  const attributesParam = searchParams.get('attributes');
  if (attributesParam) {
    try {
      const parsedAttributes = JSON.parse(attributesParam);
      if (Array.isArray(parsedAttributes)) {
        query.set('attributes', attributesParam);
      }
    } catch (e) {}
  }

  const sortField = searchParams.get('sort') || 'listPrice';
  if (ALLOWED_SORT_FIELDS.includes(sortField)) {
    query.set('sort', sortField);
  } else {
    query.set('sort', 'listPrice');
  }

  const listingAggMode = searchParams.get('listingAggMode');
  if (listingAggMode === 'false') {
    query.set('listingAggMode', 'false');
  } else {
    query.set('listingAggMode', 'true');
  }

  const sortDirection = searchParams.get('sort_direction') || 'asc';
  if (ALLOWED_SORT_DIRECTIONS.includes(sortDirection)) {
    query.set('sort_direction', sortDirection);
  } else {
    query.set('sort_direction', 'asc');
  }

  const paymentMintsParam = searchParams.get('paymentMints');
  if (paymentMintsParam) {
    query.set('paymentMints', paymentMintsParam);
  }

  const queryString = query.toString();
  const apiUrl = `${MAGIC_EDEN_BASE_URL}/collections/${symbol}/listings${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      let errorBody = 'Could not read error body.';
      try {
        errorBody = await response.text();
      } catch {}
      if (response.status === 404) {
        return NextResponse.json({ message: `Collection with symbol "${symbol}" not found on Magic Eden.` }, { status: 404 });
      }
      return NextResponse.json({ message: `Failed to fetch listings from Magic Eden. Status: ${response.status}` }, { status: response.status });
    }

    const listingsData = await response.json();
    return NextResponse.json(listingsData);

  } catch (error: unknown) {
    let errorMessage = 'An unexpected internal server error occurred.';
    if (error instanceof SyntaxError) {
      errorMessage = 'Failed to parse response from Magic Eden API (Invalid JSON).';
    } else if (error instanceof Error) {
      errorMessage = `Network or fetch error: ${error.message}`;
    }
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
