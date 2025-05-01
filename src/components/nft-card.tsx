"use client"

import type React from "react"

import { Star } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Listing } from "@/utils/types"

interface NftCardProps {
  listing: Listing
  onClick: () => void
  hasImageError: boolean
  placeholderImageSrc: string
  formatPrice: (price: number | null | undefined) => string
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void
}

export function NftCard({
  listing,
  onClick,
  hasImageError,
  placeholderImageSrc,
  formatPrice,
  onImageError,
}: NftCardProps) {
  const imageSrc = listing.token?.image
  const nftName = listing.token?.name || "Unnamed NFT"
  const rank = listing.rarity?.moonrank?.rank

  return (
    <Card
      onClick={onClick}
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group h-full flex flex-col"
    >
      <div className="relative aspect-square bg-muted/50 overflow-hidden">
        {imageSrc && !hasImageError ? (
          <img
            src={imageSrc || "/placeholder.svg"}
            alt={nftName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={onImageError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <img
              src={placeholderImageSrc || "/placeholder.svg"}
              alt="Placeholder"
              className="max-h-[80%] max-w-[80%] object-contain opacity-50"
              loading="lazy"
            />
          </div>
        )}
        {rank !== undefined && (
          <Badge variant="secondary" className="absolute right-2 top-2 bg-black/70 text-white font-medium">
            <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
            Rank: {rank}
          </Badge>
        )}
      </div>
      <CardContent className="p-4 flex-grow">
        <h3 className="font-semibold truncate" title={nftName}>
          {nftName}
        </h3>
        <p className="text-xl font-bold mt-1 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {formatPrice(listing.price)} SOL
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="secondary" className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
