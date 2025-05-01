'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Listing } from '@/utils/types';

const PLACEHOLDER_IMAGE_SRC = '/placeholder-image.png';

export default function CollectionListingsPage() {
  const params = useParams();
  const symbol = typeof params.symbol === 'string' ? decodeURIComponent(params.symbol) : '';

  const [listings, setListings] = useState<Listing[]>([]);
  const [collectionName, setCollectionName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const fetchListings = useCallback(async (collectionSymbol: string) => {
    if (!collectionSymbol) {
        setError("Collection symbol is missing.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    setImageErrors({});

    console.log(`Fetching listings for decoded symbol: ${collectionSymbol}`);

    try {
      const apiSymbol = encodeURIComponent(collectionSymbol);
      const response = await fetch(`/api/listings/${apiSymbol}`);

      if (!response.ok) {
        let errorMessage = `Failed to fetch listings (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
            console.warn("Could not parse error response body:", parseError);
        }
        setCollectionName(collectionSymbol);
        throw new Error(errorMessage);
      }

      const data: any[] = await response.json();

      if (!Array.isArray(data)) {
          console.error("API did not return an array:", data);
          throw new Error("Received invalid data format from listings API.");
      }

      const validListings: Listing[] = data.filter((item): item is Listing =>
          item &&
          typeof item.price === 'number' && item.price >= 0 &&
          item.token &&
          typeof item.token.image === 'string' && item.token.image &&
          typeof item.token.name === 'string' &&
          (typeof item.pdaAddress === 'string' || typeof item.tokenMint === 'string')
      );

       if (validListings.length > 0 && validListings[0].token?.collectionName) {
          setCollectionName(validListings[0].token.collectionName);
      } else {
          setCollectionName(collectionSymbol);
      }

      setListings(validListings);
      console.log(`Successfully loaded ${validListings.length} valid listings for ${collectionSymbol}.`);

    } catch (err) {
      console.error(`Error fetching listings for ${collectionSymbol}:`, err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (symbol) {
      fetchListings(symbol);
    } else if (params.symbol) {
        console.warn("Symbol parameter is not a string:", params.symbol);
        setError("Invalid collection symbol in URL.");
        setIsLoading(false);
    }
  }, [symbol]);

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return 'N/A';
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const handleImageError = (key: string) => {
      console.warn(`Image failed to load for listing: ${key}. Rendering fallback.`);
      setImageErrors(prev => ({ ...prev, [key]: true }));
  };

  return (
    <div className="container mx-auto px-4 py-8 text-black dark:text-white">
      <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mb-6 inline-block">
        &larr; Back to Collections
      </Link>

      <h1 className="text-3xl font-bold mb-2 text-center capitalize">
        {collectionName || 'Collection'} Listings
      </h1>
      {collectionName !== symbol && <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Symbol: {symbol}</p>}

      {isLoading && (
        <div className="text-center text-xl font-semibold text-gray-600 dark:text-gray-400 mt-12">
          Loading listings...
        </div>
      )}

      {error && (
        <div className="text-center text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded p-4 max-w-xl mx-auto mt-12">
          <p><strong className="font-bold">Error:</strong> {error}</p>
        </div>
      )}

      {!isLoading && !error && listings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {listings.map((listing) => {
            const key = listing.pdaAddress || listing.tokenMint;
            const hasError = imageErrors[key];
            const imageSrc = listing.token?.image;
            const nftName = listing.token?.name || 'Unnamed NFT';
            const rank = listing.rarity?.moonrank?.rank;

            return (
              <div
                key={key}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 flex flex-col transition-shadow duration-200 hover:shadow-xl"
              >
                <div className="relative w-full h-60 bg-gray-200 dark:bg-gray-700">
                  {imageSrc && !hasError ? (
                    <img
                      src={imageSrc}
                      alt={nftName}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(key)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                         <img
                            src={PLACEHOLDER_IMAGE_SRC}
                            alt="Placeholder"
                            className="max-w-[80%] max-h-[80%] object-contain"
                        />
                    </div>
                  )}
                   {rank !== undefined && (
                        <span className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded">
                            Rank: {rank}
                        </span>
                    )}
                </div>

                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-md font-semibold truncate" title={nftName}>
                      {nftName}
                    </h3>
                    <p className="text-lg font-bold mt-1">
                      {formatPrice(listing.price)} SOL
                    </p>
                  </div>
                  <button
                    onClick={() => alert(`Implement purchase logic for ${nftName} (${listing.tokenMint})`)}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !error && listings.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
          No active listings found for this collection, or they could not be loaded.
        </div>
      )}
    </div>
  );
}