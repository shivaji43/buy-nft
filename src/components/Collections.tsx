"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { Collection } from "@/utils/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Info, Sparkles, TrendingUp, Clock, Calendar, CalendarDays } from "lucide-react"

const TIME_RANGES = ["1h", "1d", "7d", "30d"] as const
type TimeRange = (typeof TIME_RANGES)[number]

const SOL_LAMPORTS = 1_000_000_000

export default function CollectionsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("1d")
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCollections = useCallback(async (timeRange: TimeRange) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/collections?timeRange=${timeRange}`)

      if (!response.ok) {
        let errorMessage = `Failed to fetch collections (${response.status})`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
        }
        throw new Error(errorMessage)
      }

      const rawData = await response.json()

      if (!Array.isArray(rawData)) {
        console.error("API response is not an array:", rawData)
        throw new Error("Invalid data format received from collections API.")
      }

      const validCollections = rawData.filter(
        (item) => item && typeof item.symbol === "string" && item.symbol.length > 0,
      )

      const uniqueCollectionsMap = new Map<string, Collection>()
      validCollections.forEach((collection) => {
        uniqueCollectionsMap.set(collection.symbol, collection as Collection)
      })

      const uniqueCollections = Array.from(uniqueCollectionsMap.values())
      setCollections(uniqueCollections)
    } catch (err) {
      console.error("Error fetching collections:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setCollections([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCollections(selectedTimeRange)
  }, [selectedTimeRange, fetchCollections])

  const formatFloorPrice = (lamports: number | null | undefined): string => {
    if (lamports === null || lamports === undefined) return "N/A"
    const sol = lamports / SOL_LAMPORTS
    return sol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  }

  // Helper function to get the appropriate icon for time range
  const getTimeRangeIcon = (range: TimeRange) => {
    switch (range) {
      case "1h":
        return <Clock className="h-4 w-4" />
      case "1d":
        return <Calendar className="h-4 w-4" />
      case "7d":
        return <CalendarDays className="h-4 w-4" />
      case "30d":
        return <CalendarDays className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-1 rounded-full">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">Explore NFT Collections</span>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Popular Solana NFT Collections
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover trending NFT collections on Solana. Browse by different time periods to see what's hot right now.
        </p>
      </div>

      {/* Time Range Tabs */}
      <div className="flex justify-center mb-8">
        <Tabs
          defaultValue={selectedTimeRange}
          value={selectedTimeRange}
          onValueChange={(value) => setSelectedTimeRange(value as TimeRange)}
          className="w-full max-w-md"
        >
          <TabsList className="grid grid-cols-4 w-full">
            {TIME_RANGES.map((range) => (
              <TabsTrigger key={range} value={range} disabled={isLoading} className="flex items-center gap-2">
                {getTimeRangeIcon(range)}
                <span>{range.toUpperCase()}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-48 bg-muted">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive max-w-xl mx-auto">
          <div className="flex flex-col items-center gap-2">
            <Info className="h-8 w-8" />
            <h3 className="font-semibold text-lg">Error Loading Collections</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Collections Grid */}
      {!isLoading && !error && collections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <Link
              href={`/collection/${encodeURIComponent(collection.symbol)}`}
              key={collection.symbol}
              className="block h-full"
            >
              <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
                <div className="relative h-48 bg-muted/50 overflow-hidden">
                  <img
                    src={collection.image || "/placeholder-image.png"}
                    alt={collection.name || "Collection Image"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      if (target.src !== "/placeholder-image.png") {
                        target.src = "/placeholder-image.png"
                        target.alt = `${collection.name || "Unnamed Collection"} (Image unavailable)`
                        target.style.objectFit = "contain"
                      }
                    }}
                  />
                  { (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 bg-green-500/90 text-white font-medium"
                    >
                      <TrendingUp className="mr-1 h-3 w-3" />
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 flex-grow">
                  <h2
                    className="text-lg font-bold truncate group-hover:text-purple-600 transition-colors"
                    title={collection.name}
                  >
                    {collection.name || "Unnamed Collection"}
                  </h2>
                  {collection.symbol && (
                    <p className="text-sm text-muted-foreground mb-2 truncate" title={collection.symbol}>
                      Symbol: {collection.symbol}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
                    <p className="text-sm">
                      Floor: <span className="font-semibold">{formatFloorPrice(collection.floorPrice)} SOL</span>
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-purple-50 group-hover:text-purple-600 group-hover:border-purple-200 transition-colors"
                  >
                    View Collection
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* No Collections State */}
      {!isLoading && !error && collections.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Info className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Collections Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            No popular collections found for the selected time range. Try selecting a different time period.
          </p>
        </div>
      )}
    </div>
  )
}
