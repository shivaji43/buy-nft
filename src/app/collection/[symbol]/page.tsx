


"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import type { Listing, NftDetail, FilterState } from "@/utils/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Filter,
  SortAsc,
  SortDesc,
  Info,
  CircleIcon,
  Twitter,
  Github,
  Sun,
  Moon,
} from "lucide-react"
import {   FaGithub, FaSun, FaMoon } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { NftCard } from "@/components/nft-card"
import { NftDetailsModal } from "@/components/nft-details-modal"
import { FaBars, FaTimes } from "react-icons/fa";
import { BsCircleHalf } from "react-icons/bs"
const PLACEHOLDER_IMAGE_SRC = "/placeholder-image.png"
const DEFAULT_LIMIT = 20
const DEBOUNCE_DELAY = 500

export default function CollectionListingsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const symbol = typeof params.symbol === "string" ? decodeURIComponent(params.symbol) : ""

  const [listings, setListings] = useState<Listing[]>([])
  const [collectionName, setCollectionName] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [darkMode, setDarkMode] = useState(false)

  const [filters, setFilters] = useState<FilterState>(() => {
    const initialOffset = Number.parseInt(searchParams.get("offset") || "0", 10)
    const initialLimit = Number.parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10)
    return {
      minPrice: searchParams.get("min_price") || "",
      maxPrice: searchParams.get("max_price") || "",
      sortBy: (searchParams.get("sort") as FilterState["sortBy"]) || "listPrice",
      sortDir: (searchParams.get("sort_direction") as FilterState["sortDir"]) || "asc",
      offset: !isNaN(initialOffset) && initialOffset >= 0 ? initialOffset : 0,
      limit: !isNaN(initialLimit) && initialLimit >= 1 && initialLimit <= 100 ? initialLimit : DEFAULT_LIMIT,
    }
  })
const [menuOpen, setMenuOpen] = useState(false);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true)

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedNftDetail, setSelectedNftDetail] = useState<NftDetail | null>(null)
  const [isModalLoading, setIsModalLoading] = useState<boolean>(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize dark mode based on user preference on component mount
  useEffect(() => {
    // Check if user previously set dark mode preference
    const isDarkMode = localStorage.getItem("darkMode") === "true"
    setDarkMode(isDarkMode)

    // Apply the class to the document
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)

    // Save preference to localStorage
    localStorage.setItem("darkMode", newDarkMode.toString())

    // Add or remove dark class from document
    if (newDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const fetchListings = useCallback(async (collectionSymbol: string, currentFilters: FilterState) => {
    if (!collectionSymbol) {
      setError("Collection symbol is missing.")
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)

    const query = new URLSearchParams()
    query.set("offset", String(currentFilters.offset))
    query.set("limit", String(currentFilters.limit))
    if (currentFilters.minPrice && !isNaN(Number.parseFloat(currentFilters.minPrice)))
      query.set("min_price", currentFilters.minPrice)
    if (currentFilters.maxPrice && !isNaN(Number.parseFloat(currentFilters.maxPrice)))
      query.set("max_price", currentFilters.maxPrice)
    query.set("sort", currentFilters.sortBy)
    query.set("sort_direction", currentFilters.sortDir)

    const queryString = query.toString()
    const apiSymbol = encodeURIComponent(collectionSymbol)
    const apiUrl = `/api/listings/${apiSymbol}?${queryString}`

    try {
      const response = await fetch(apiUrl)
      if (!response.ok) {
        let errorMessage = `Failed to fetch listings (${response.status})`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch {}
        setCollectionName(collectionSymbol)
        throw new Error(errorMessage)
      }
      const data = await response.json()
      if (!Array.isArray(data)) throw new Error("Received invalid data format from listings API.")

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
            (item.token && typeof item.token.mint === "string")),
      )

      if (currentFilters.offset === 0 && validListings.length > 0 && validListings[0].token?.collectionName) {
        setCollectionName(validListings[0].token.collectionName)
      } else if (currentFilters.offset === 0) setCollectionName(collectionSymbol)

      setListings(validListings)
      setHasNextPage(validListings.length === currentFilters.limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setListings([])
      setHasNextPage(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getTokenAddress = (listing: Listing): string => {
    if (listing.tokenMint) return listing.tokenMint
    if (listing.tokenAddress) return listing.tokenAddress
    if (listing.pdaAddress) return listing.pdaAddress
    throw new Error("No token address found in the listing data")
  }

  const fetchNftDetails = async (mint: string) => {
    setIsModalLoading(true)
    setModalError(null)
    setSelectedNftDetail(null)
    setIsModalOpen(true)

    try {
      const response = await fetch(`/api/mint/${mint}`)
      if (!response.ok) {
        let errorMsg = `Failed to fetch NFT details (${response.status})`
        try {
          const errData = await response.json()
          errorMsg = errData.message || errorMsg
        } catch {}
        throw new Error(errorMsg)
      }
      const data: NftDetail = await response.json()
      setSelectedNftDetail(data)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to load NFT details.")
    } finally {
      setIsModalLoading(false)
    }
  }

  useEffect(() => {
    if (symbol) {
      fetchListings(symbol, filters)
      const currentParams = new URLSearchParams()
      if (filters.offset > 0) currentParams.set("offset", String(filters.offset))
      if (filters.limit !== DEFAULT_LIMIT) currentParams.set("limit", String(filters.limit))
      if (filters.minPrice) currentParams.set("min_price", filters.minPrice)
      if (filters.maxPrice) currentParams.set("max_price", filters.maxPrice)
      if (filters.sortBy !== "listPrice") currentParams.set("sort", filters.sortBy)
      if (filters.sortDir !== "asc") currentParams.set("sort_direction", filters.sortDir)
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`
      router.replace(newUrl, { scroll: false })
    } else if (params.symbol) {
      setError("Invalid collection symbol in URL.")
      setIsLoading(false)
    }
  }, [symbol, filters, fetchListings, router, params.symbol])

  const handleFilterChangeWithDebounce = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, offset: 0 }))
    }, DEBOUNCE_DELAY)
  }

  const handleSortChange = (value: string, type: "sortBy" | "sortDir") => {
    setFilters((prev) => ({
      ...prev,
      [type]: value as any,
      offset: 0,
    }))
  }

  const handleNextPage = () => {
    if (hasNextPage) setFilters((prev) => ({ ...prev, offset: prev.offset + prev.limit }))
  }

  const handlePrevPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }))
  }

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return "N/A"
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, key: string) => {
    setImageErrors((prev) => ({ ...prev, [key]: true }))
  }

  const handleNftCardClick = (listing: Listing) => {
    try {
      const tokenAddress = getTokenAddress(listing)
      fetchNftDetails(tokenAddress)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to get token address.")
      setIsModalOpen(true)
    }
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-[#bba8f2] text-gray-900"
      } overflow-hidden relative transition-colors duration-300`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-30">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full border ${darkMode ? "border-purple-300" : "border-purple-900"}`}
            style={{
              width: `${(i + 1) * 20}%`,
              height: `${(i + 1) * 20}%`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <header className="container mx-auto px-4 py-6 flex items-center justify-between relative">
                 {/* Logo */}
                 <div className="flex items-center gap-2 md:ml-5">
                   <BsCircleHalf size={36} className="text-purple-500" />
                  <a href="/">
                <span className="text-2xl font-bold">LiquiDate</span>
            </a>
                 </div>
       
                 {/* Desktop Nav */}
                 <nav className="hidden md:flex items-center gap-10">
                   
                 </nav>
       
                 {/* Right Section (Visible Only on md and Up) */}
                 <div className="hidden md:flex items-center gap-4 md:mr-52">
                   <a
                     href="https://x.com/raut_madridista"
                     target="_blank"
                     rel="noopener noreferrer"
                     className={`${
                       darkMode
                         ? "text-purple-300 hover:text-purple-200"
                         : "text-purple-900 hover:text-purple-700"
                     } transition-colors`}
                   >
                     <FaXTwitter size={20} />
                   </a>
                   <a
                     href="https://github.com/shivaji43/buy-nft/"
                     target="_blank"
                     rel="noopener noreferrer"
                     className={`${
                       darkMode
                         ? "text-purple-300 hover:text-purple-200"
                         : "text-purple-900 hover:text-purple-700"
                     } transition-colors`}
                   >
                     <FaGithub size={20} />
                   </a>
                   <button
                     onClick={toggleDarkMode}
                     className={`p-2 rounded-full ${
                       darkMode
                         ? "bg-gray-800 text-yellow-300 hover:bg-gray-700"
                         : "bg-purple-200 text-purple-900 hover:bg-purple-300"
                     } transition-colors`}
                     aria-label={
                       darkMode ? "Switch to light mode" : "Switch to dark mode"
                     }
                   >
                     {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                   </button>
                 </div>
       
                 {/* Mobile Menu Toggle */}
                 <div className="md:hidden">
                   <button
                     onClick={() => setMenuOpen(!menuOpen)}
                     className="text-purple-500"
                     aria-label="Toggle menu"
                   >
                     {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                   </button>
                 </div>
       
                 {/* Mobile Menu */}
                 {menuOpen && (
                   <div className="absolute top-10 left-60 w-full bg-transparent dark:bg-gray-900 px-4 py-6 flex flex-col gap-4 md:hidden z-50">
                    
       
                     {/* Social Icons and Dark Mode for Mobile */}
                     <div className="flex items-center gap-4 mt-4">
                       <a
                         href="https://x.com/raut_madridista"
                         target="_blank"
                         rel="noopener noreferrer"
                         className={`${
                           darkMode
                             ? "text-purple-300 hover:text-purple-200"
                             : "text-purple-900 hover:text-purple-700"
                         } transition-colors`}
                       >
                         <FaXTwitter size={20} />
                       </a>
                       <a
                         href="https://github.com/shivaji43/buy-nft/"
                         target="_blank"
                         rel="noopener noreferrer"
                         className={`${
                           darkMode
                             ? "text-purple-300 hover:text-purple-200"
                             : "text-purple-900 hover:text-purple-700"
                         } transition-colors`}
                       >
                         <FaGithub size={20} />
                       </a>
                       <button
                         onClick={toggleDarkMode}
                         className={`p-2 rounded-full ${
                           darkMode
                             ? "bg-gray-800 text-yellow-300 hover:bg-gray-700"
                             : "bg-purple-200 text-purple-900 hover:bg-purple-300"
                         } transition-colors`}
                         aria-label={
                           darkMode ? "Switch to light mode" : "Switch to dark mode"
                         }
                       >
                         {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                       </button>
                     </div>
                   </div>
                 )}
               </header>

        <div className="container mx-auto px-4 py-8 relative">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Button
              variant="ghost"
              asChild
              className={`absolute top-4 left-4 text-sm p-2 h-auto group flex items-center gap-1 ${
                darkMode
                  ? "hover:bg-gray-800 text-purple-300 hover:text-purple-200"
                  : "hover:bg-purple-200/50 text-purple-900 hover:text-purple-700"
              }`}
            >
              <Link href="/collections">
                <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
                <span>Back to Collections</span>
              </Link>
            </Button>
          </motion.div>

          <motion.div
            className="mb-8 pt-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.h1
              className={`text-4xl font-bold capitalize ${darkMode ? "text-purple-400" : "text-purple-800"}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {collectionName || "Collection"} Listings
            </motion.h1>
            {collectionName !== symbol && (
              <motion.p
                className={`${darkMode ? "text-gray-300" : "text-gray-700"} mt-2`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Symbol: {symbol}
              </motion.p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            <Card
              className={`mb-8 shadow-md ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-200"}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className={`h-5 w-5 ${darkMode ? "text-purple-400" : "text-purple-500"}`} />
                  <h2 className={`text-lg font-semibold ${darkMode ? "text-purple-300" : "text-purple-900"}`}>
                    Filters
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:pb-6 pb-2 items-end">
                  <div className="space-y-2">
                    <label
                      htmlFor="minPrice"
                      className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
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
                      className={darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="maxPrice"
                      className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
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
                      className={darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="sortBy"
                      className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Sort By
                    </label>
                    <Select value={filters.sortBy} onValueChange={(value) => handleSortChange(value, "sortBy")}>
                      <SelectTrigger className={darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className={darkMode ? "bg-gray-800 border-gray-700 text-white" : ""}>
                        <SelectItem value="listPrice">Price</SelectItem>
                        <SelectItem value="updatedAt">Recently Listed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="sortDir"
                      className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Direction
                    </label>
                    <Select value={filters.sortDir} onValueChange={(value) => handleSortChange(value, "sortDir")}>
                      <SelectTrigger className={darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}>
                        <SelectValue placeholder="Direction" />
                      </SelectTrigger>
                      <SelectContent className={darkMode ? "bg-gray-800 border-gray-700 text-white" : ""}>
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
          </motion.div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card
                    className={`overflow-hidden h-full flex flex-col ${
                      darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-200"
                    }`}
                  >
                    <div className="aspect-square">
                      <Skeleton className={`h-full w-full ${darkMode ? "bg-gray-700" : "bg-purple-100"}`} />
                    </div>
                    <div className="p-4 flex-grow">
                      <Skeleton className={`h-4 w-3/4 mb-2 ${darkMode ? "bg-gray-700" : "bg-purple-100"}`} />
                      <Skeleton className={`h-6 w-1/2 ${darkMode ? "bg-gray-700" : "bg-purple-100"}`} />
                    </div>
                    <div className="p-4 pt-0">
                      <Skeleton className={`h-9 w-full ${darkMode ? "bg-gray-700" : "bg-purple-100"}`} />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {error && (
            <motion.div
              className={`rounded-lg border p-6 text-center max-w-xl mx-auto ${
                darkMode
                  ? "border-red-500/50 bg-red-500/10 text-red-400"
                  : "border-red-500/50 bg-red-500/10 text-red-600"
              }`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col items-center gap-2">
                <Info className="h-8 w-8" />
                <h3 className="font-semibold text-lg">Error Loading Listings</h3>
                <p className="text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {!isLoading && !error && listings.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {listings.map((listing, index) => {
                  const key = listing.pdaAddress || listing.tokenMint || "unknown-key-" + Math.random()
                  const hasError = imageErrors[key]

                  return (
                    <motion.div
                      key={key}
                      className="h-full"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                    >
                      <div className={`h-full ${darkMode ? "text-white" : ""}`}>
                        <NftCard
                          listing={listing}
                          onClick={() => handleNftCardClick(listing)}
                          hasImageError={hasError}
                          placeholderImageSrc={PLACEHOLDER_IMAGE_SRC}
                          formatPrice={formatPrice}
                          onImageError={(e) => handleImageError(e, key)}
                          darkMode={darkMode}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <motion.div
                className="flex justify-center items-center gap-4 mt-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.9 }}
              >
                <Button
                  variant={darkMode ? "outline" : "outline"}
                  onClick={handlePrevPage}
                  disabled={filters.offset === 0 || isLoading}
                  className={`flex items-center gap-1 ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                      : "border-purple-300 hover:bg-purple-100"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : ""}`}>
                  Page {Math.floor(filters.offset / filters.limit) + 1}
                </span>
                <Button
                  variant={darkMode ? "outline" : "outline"}
                  onClick={handleNextPage}
                  disabled={!hasNextPage || isLoading}
                  className={`flex items-center gap-1 ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                      : "border-purple-300 hover:bg-purple-100"
                  }`}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </>
          )}

          {!isLoading && !error && listings.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div
                className={`mx-auto w-24 h-24 rounded-full ${
                  darkMode ? "bg-gray-800" : "bg-purple-100"
                } flex items-center justify-center mb-4`}
              >
                <Info className={`h-10 w-10 ${darkMode ? "text-purple-400" : "text-purple-500"}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? "text-purple-300" : "text-purple-800"}`}>
                No Listings Found
              </h3>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} max-w-md mx-auto`}>
                No active listings match your criteria for this collection. Try adjusting your filters or check back
                later.
              </p>
            </motion.div>
          )}

          <NftDetailsModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            nftDetail={selectedNftDetail}
            isLoading={isModalLoading}
            error={modalError}
            darkMode={darkMode}
          />
        </div>
      </div>
    </div>
  )
}
