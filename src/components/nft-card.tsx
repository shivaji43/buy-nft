"use client"

import type React from "react"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Listing } from "@/utils/types"
import { Copy } from "lucide-react"
import {  Check } from "lucide-react";
import { useState } from "react"

interface NftCardProps {
  listing: Listing
  onClick: () => void
  hasImageError: boolean
  placeholderImageSrc: string
  formatPrice: (price: number | null | undefined) => string
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void
  darkMode?: boolean
  getTokenAddress?: (listing: Listing) => string
}

export function NftCard({
  listing,
  onClick,
  hasImageError,
  placeholderImageSrc,
  formatPrice,
  onImageError,
  darkMode = false,
  getTokenAddress,
}: NftCardProps) {
  const tokenAddress = getTokenAddress
    ? getTokenAddress(listing)
    : listing.tokenMint || listing.tokenAddress || listing.pdaAddress || ""

  const truncateAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    setCopied(true);
    navigator.clipboard.writeText(text)
  }
   const [copied, setCopied] = useState(false);


  return (
    <Card
      className={`overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl group cursor-pointer ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-200"
      }`}
      onClick={onClick}
    >
      <div className="aspect-square bg-muted overflow-hidden">
        <img
          src={hasImageError ? placeholderImageSrc : listing.token.image}
          alt={listing.token.name || "NFT Image"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={onImageError}
          loading="lazy"
        />
      </div>
      <CardContent className={`p-4 flex-grow ${darkMode ? "text-gray-200" : ""}`}>
        <h3 className={`font-bold truncate group-hover:text-purple-500 transition-colors`} title={listing.token.name}>
          {listing.token.name}
        </h3>

        {/* Token Address */}
        <div className={`mt-1 flex items-center gap-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          <p className="text-xs truncate" title={tokenAddress}>
            {truncateAddress(tokenAddress)}
          </p>
          <button
            onClick={(e) => copyToClipboard(e, tokenAddress)}
            className={`p-1 rounded-full hover:${darkMode ? "bg-gray-700" : "bg-purple-100"}`}
            title="Copy address"
          >
            {/* <Copy className="h-3 w-3" /> */}
             {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
            <p className={`text-lg font-semibold ${darkMode ? "text-purple-300" : "text-purple-800"}`}>
              {formatPrice(listing.price)} SOL
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className={`w-full ${
            darkMode
              ? "bg-purple-600 hover:bg-purple-700 text-white border-none"
              : "bg-purple-700 hover:bg-purple-800 text-white border-none"
          }`}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
