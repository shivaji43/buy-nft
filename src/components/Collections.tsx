
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; 
import { Collection } from '@/utils/types';

const TIME_RANGES = ['1h', '1d', '7d', '30d'] as const;
type TimeRange = typeof TIME_RANGES[number];

const SOL_LAMPORTS = 1_000_000_000;

export default function CollectionsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1d');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async (timeRange: TimeRange) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/collections?timeRange=${timeRange}`);

      if (!response.ok) {
        let errorMessage = `Failed to fetch collections (${response.status})`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
            console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const rawData: any[] = await response.json(); // Use any[] temporarily if type is uncertain

       // Validate that rawData is an array
      if (!Array.isArray(rawData)) {
        console.error("API response is not an array:", rawData);
        throw new Error("Invalid data format received from collections API.");
      }

      // Filter out items that don't look like valid collections or lack a symbol
      const validCollections = rawData.filter(item =>
          item && typeof item.symbol === 'string' && item.symbol.length > 0
      );

      // De-duplicate based on symbol
      const uniqueCollectionsMap = new Map<string, Collection>();
      validCollections.forEach(collection => {
        // Basic type assertion or more robust validation needed here
        // Assuming the structure matches 'Collection' for valid items
        uniqueCollectionsMap.set(collection.symbol, collection as Collection);
      });

      const uniqueCollections = Array.from(uniqueCollectionsMap.values());
      setCollections(uniqueCollections);

    } catch (err) {
      console.error("Error fetching collections:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections(selectedTimeRange);
  }, [selectedTimeRange, fetchCollections]);

  const formatFloorPrice = (lamports: number | null | undefined): string => {
    if (lamports === null || lamports === undefined) return 'N/A';
    const sol = lamports / SOL_LAMPORTS;
    return sol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  return (
    <div className="container mx-auto px-4 py-8 text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Popular Solana NFT Collections</h1>

      {/* Time Range Buttons */}
      <div className="flex justify-center flex-wrap space-x-2 mb-8">
        {TIME_RANGES.map((range) => (
          <button
            key={range}
            onClick={() => setSelectedTimeRange(range)}
            disabled={isLoading}
            className={`
              px-4 py-2 rounded font-semibold transition-colors duration-200 ease-in-out
              ${selectedTimeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {range.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center text-xl font-semibold text-gray-600 dark:text-gray-400">
          Loading collections...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded p-4 max-w-xl mx-auto">
          <p><strong className="font-bold">Error:</strong> {error}</p>
        </div>
      )}

      {/* Collections Grid */}
      {!isLoading && !error && collections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {collections.map((collection) => (
            // Wrap the card content with Next.js Link component
            <Link
                href={`/collection/${encodeURIComponent(collection.symbol)}`} // Encode symbol for URL safety
                key={collection.symbol}
                className="group block border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 hover:shadow-xl transition-all duration-300 ease-in-out hover:scale-105" // Added group, block, transitions and hover effect
            >
              {/* Card Content */}
              <div>
                  <img
                    // Use collection.image, fallback to placeholder if null/undefined
                    src={collection.image || '/placeholder-image.png'}
                    alt={collection.name || 'Collection Image'}
                    className="w-full h-48 object-cover bg-gray-200 dark:bg-gray-700" // Ensure background for loading/error states
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                       // Set to placeholder on error only if not already placeholder
                      if (target.src !== '/placeholder-image.png') {
                          target.src = '/placeholder-image.png';
                          target.alt = `${collection.name || 'Unnamed Collection'} (Image unavailable)`;
                          target.style.objectFit = 'contain'; // Adjust fit for placeholder
                      }
                    }}
                  />
                  <div className="p-4">
                    <h2 className="text-lg font-bold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400" title={collection.name}> {/* Optional: change text color on hover */}
                        {collection.name || 'Unnamed Collection'}
                    </h2>
                    {collection.symbol && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate" title={collection.symbol}>
                            Symbol: {collection.symbol}
                        </p>
                    )}
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Floor Price: <span className="font-semibold">{formatFloorPrice(collection.floorPrice)} SOL</span>
                    </p>
                  </div>
              </div>
            </Link> // End of Link component
          ))}
        </div>
      )}

      {/* No Collections State */}
      {!isLoading && !error && collections.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
          No popular collections found for the selected time range.
        </div>
      )}
    </div>
  );
}
