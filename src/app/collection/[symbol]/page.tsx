"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Listing, NftDetail, FilterState } from "@/utils/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Filter,
  SortAsc,
  SortDesc,
  Info,
} from "lucide-react";
import { NftCard } from "@/components/nft-card";
import { NftDetailsModal } from "@/components/nft-details-modal";

const PLACEHOLDER_IMAGE_SRC = "/placeholder-image.png";
const DEFAULT_LIMIT = 20;
const DEBOUNCE_DELAY = 500;

export default function CollectionListingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const symbol = typeof params.symbol === "string" ? decodeURIComponent(params.symbol) : "";

  const [listings, setListings] = useState<Listing[]>([]);
  const [collectionName, setCollectionName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const [filters, setFilters] = useState<FilterState>(() => {
    const initialOffset = Number.parseInt(
      searchParams.get("offset") || "0",
      10
    );
    const initialLimit = Number.parseInt(
      searchParams.get("limit") || String(DEFAULT_LIMIT),
      10
    );
    return {
      minPrice: searchParams.get("min_price") || "",
      maxPrice: searchParams.get("max_price") || "",
      sortBy:
        (searchParams.get("sort") as FilterState["sortBy"]) || "listPrice",
      sortDir:
        (searchParams.get("sort_direction") as FilterState["sortDir"]) || "asc",
      offset: !isNaN(initialOffset) && initialOffset >= 0 ? initialOffset : 0,
      limit:
        !isNaN(initialLimit) && initialLimit >= 1 && initialLimit <= 100
          ? initialLimit
          : DEFAULT_LIMIT,
    };
  });

  const [hasNextPage, setHasNextPage] = useState<boolean>(true);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedNftDetail, setSelectedNftDetail] = useState<NftDetail | null>(
    null
  );
  const [isModalLoading, setIsModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchListings = useCallback(
    async (collectionSymbol: string, currentFilters: FilterState) => {
      if (!collectionSymbol) {
        setError("Collection symbol is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);

      const query = new URLSearchParams();
      query.set("offset", String(currentFilters.offset));
      query.set("limit", String(currentFilters.limit));
      if (
        currentFilters.minPrice &&
        !isNaN(Number.parseFloat(currentFilters.minPrice))
      )
        query.set("min_price", currentFilters.minPrice);
      if (
        currentFilters.maxPrice &&
        !isNaN(Number.parseFloat(currentFilters.maxPrice))
      )
        query.set("max_price", currentFilters.maxPrice);
      query.set("sort", currentFilters.sortBy);
      query.set("sort_direction", currentFilters.sortDir);

      const queryString = query.toString();
      const apiSymbol = encodeURIComponent(collectionSymbol);
      const apiUrl = `/api/listings/${apiSymbol}?${queryString}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          let errorMessage = `Failed to fetch listings (${response.status})`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {}
          setCollectionName(collectionSymbol);
          throw new Error(errorMessage);
        }
        const data = await response.json();
        if (!Array.isArray(data))
          throw new Error("Received invalid data format from listings API.");

        const validListings: Listing[] = data.filter(
          (item): item is Listing =>
            item &&
            typeof item.price === "number" &&
            item.price >= 0 &&
            item.token &&
            typeof item.token.image === "string" &&
            item.token.image &&
            typeof item.token.name === "string" &&
            // Allow for different property names that might contain the token address
            (typeof item.pdaAddress === "string" ||
              typeof item.tokenMint === "string" ||
              typeof item.tokenAddress === "string" ||
              (item.token && typeof item.token.mint === "string"))
        );

        if (
          currentFilters.offset === 0 &&
          validListings.length > 0 &&
          validListings[0].token?.collectionName
        ) {
          setCollectionName(validListings[0].token.collectionName);
        } else if (currentFilters.offset === 0)
          setCollectionName(collectionSymbol);

        setListings(validListings);
        setHasNextPage(validListings.length === currentFilters.limit);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setListings([]);
        setHasNextPage(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getTokenAddress = (listing: Listing): string => {
    if (listing.tokenMint) return listing.tokenMint;
    if (listing.tokenAddress) return listing.tokenAddress;
    if (listing.pdaAddress) return listing.pdaAddress;
    throw new Error("No token address found in the listing data");
  };

  const fetchNftDetails = async (mint: string) => {
    setIsModalLoading(true);
    setModalError(null);
    setSelectedNftDetail(null);
    setIsModalOpen(true);

    try {
      const response = await fetch(`/api/mint/${mint}`);
      if (!response.ok) {
        let errorMsg = `Failed to fetch NFT details (${response.status})`;
        try {
          const errData = await response.json();
          errorMsg = errData.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }
      const data: NftDetail = await response.json();
      setSelectedNftDetail(data);
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Failed to load NFT details."
      );
    } finally {
      setIsModalLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchListings(symbol, filters);
      const currentParams = new URLSearchParams();
      if (filters.offset > 0)
        currentParams.set("offset", String(filters.offset));
      if (filters.limit !== DEFAULT_LIMIT)
        currentParams.set("limit", String(filters.limit));
      if (filters.minPrice) currentParams.set("min_price", filters.minPrice);
      if (filters.maxPrice) currentParams.set("max_price", filters.maxPrice);
      if (filters.sortBy !== "listPrice")
        currentParams.set("sort", filters.sortBy);
      if (filters.sortDir !== "asc")
        currentParams.set("sort_direction", filters.sortDir);
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      router.replace(newUrl, { scroll: false });
    } else if (params.symbol) {
      setError("Invalid collection symbol in URL.");
      setIsLoading(false);
    }
  }, [symbol, filters, fetchListings, router, params.symbol]);

  const handleFilterChangeWithDebounce = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, offset: 0 }));
    }, DEBOUNCE_DELAY);
  };

  const handleSortChange = (value: string, type: "sortBy" | "sortDir") => {
    setFilters((prev) => ({
      ...prev,
      //@
      [type]: value as any,
      offset: 0,
    }));
  };

  const handleNextPage = () => {
    if (hasNextPage)
      setFilters((prev) => ({ ...prev, offset: prev.offset + prev.limit }));
  };

  const handlePrevPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }));
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return "N/A";
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    key: string
  ) => {
    setImageErrors((prev) => ({ ...prev, [key]: true }));
  };

  const handleNftCardClick = (listing: Listing) => {
    try {
      const tokenAddress = getTokenAddress(listing);
      fetchNftDetails(tokenAddress);
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Failed to get token address."
      );
      setIsModalOpen(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          asChild
          className="mb-6 group flex items-center gap-2 hover:bg-muted/50"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Collections</span>
          </Link>
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold capitalize bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {collectionName || "Collection"} Listings
          </h1>
          {collectionName !== symbol && (
            <p className="text-muted-foreground">Symbol: {symbol}</p>
          )}
        </div>
      </div>

      <Card className="mb-8 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label htmlFor="minPrice" className="text-sm font-medium">
                Min Price (SOL)
              </label>
              <Input
                type="number"
                id="minPrice"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChangeWithDebounce}
                placeholder="e.g., 0.1"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="maxPrice" className="text-sm font-medium">
                Max Price (SOL)
              </label>
              <Input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChangeWithDebounce}
                placeholder="e.g., 10"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="sortBy" className="text-sm font-medium">
                Sort By
              </label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleSortChange(value, "sortBy")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="listPrice">Price</SelectItem>
                  <SelectItem value="updatedAt">Recently Listed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="sortDir" className="text-sm font-medium">
                Direction
              </label>
              <Select
                value={filters.sortDir}
                onValueChange={(value) => handleSortChange(value, "sortDir")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-4 w-4" />
                      <span>Ascending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="desc">
                    <div className="flex items-center gap-2">
                      <SortDesc className="h-4 w-4" />
                      <span>Descending</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="h-full">
              <Card className="overflow-hidden h-full flex flex-col">
                <div className="aspect-square">
                  <Skeleton className="h-full w-full" />
                </div>
                <div className="p-4 flex-grow">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
                <div className="p-4 pt-0">
                  <Skeleton className="h-9 w-full" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!isLoading && !error && listings.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {listings.map((listing) => {
              const key =
                listing.pdaAddress ||
                listing.tokenMint ||
                "unknown-key-" + Math.random();
              const hasError = imageErrors[key];

              return (
                <div key={key} className="h-full">
                  <NftCard
                    listing={listing}
                    onClick={() => handleNftCardClick(listing)}
                    hasImageError={hasError}
                    placeholderImageSrc={PLACEHOLDER_IMAGE_SRC}
                    formatPrice={formatPrice}
                    onImageError={(e) => handleImageError(e, key)}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-center items-center gap-4 mt-10">
            <Button
              variant="outline"
              onClick={handlePrevPage}
              disabled={filters.offset === 0 || isLoading}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm font-medium">
              Page {Math.floor(filters.offset / filters.limit) + 1}
            </span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={!hasNextPage || isLoading}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {!isLoading && !error && listings.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Info className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Listings Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            No active listings match your criteria for this collection. Try
            adjusting your filters or check back later.
          </p>
        </div>
      )}

      <NftDetailsModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        nftDetail={selectedNftDetail}
        isLoading={isModalLoading}
        error={modalError}
      />
    </div>
  );
}
