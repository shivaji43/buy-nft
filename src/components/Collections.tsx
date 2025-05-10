
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Collection } from "@/utils/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  CircleIcon,
  Twitter,
  Github,
  Sun,
  Moon,
  Clock,
  Calendar,
  TrendingUp,
  Info,
  Sparkles,
} from "lucide-react";
import { FaGithub, FaSun, FaMoon } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { BsCircleHalf } from "react-icons/bs";
import { FaBars, FaTimes } from "react-icons/fa";
const TIME_RANGES = ["1h", "1d", "7d", "30d"] as const;
type TimeRange = (typeof TIME_RANGES)[number];

const SOL_LAMPORTS = 1_000_000_000;

export default function CollectionsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("1d");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Initialize dark mode based on user preference on component mount
  useEffect(() => {
    // Check if user previously set dark mode preference
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDarkMode);

    // Apply the class to the document
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    // Save preference to localStorage
    localStorage.setItem("darkMode", newDarkMode.toString());

    // Add or remove dark class from document
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

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

      const rawData = await response.json();

      if (!Array.isArray(rawData)) {
        console.error("API response is not an array:", rawData);
        throw new Error("Invalid data format received from collections API.");
      }

      const validCollections = rawData.filter(
        (item) =>
          item && typeof item.symbol === "string" && item.symbol.length > 0
      );

      const uniqueCollectionsMap = new Map<string, Collection>();
      validCollections.forEach((collection) => {
        uniqueCollectionsMap.set(collection.symbol, collection as Collection);
      });

      const uniqueCollections = Array.from(uniqueCollectionsMap.values());
      setCollections(uniqueCollections);
    } catch (err) {
      console.error("Error fetching collections:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections(selectedTimeRange);
  }, [selectedTimeRange, fetchCollections]);

  const formatFloorPrice = (lamports: number | null | undefined): string => {
    if (lamports === null || lamports === undefined) return "N/A";
    const sol = lamports / SOL_LAMPORTS;
    return sol.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  const getTimeRangeIcon = (range: TimeRange) => {
    switch (range) {
      case "1h":
        return <Clock className="h-4 w-4" />;
      case "1d":
        return <Calendar className="h-4 w-4" />;
      case "7d":
        return <Calendar className="h-4 w-4" />;
      case "30d":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

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
            className={`absolute rounded-full border ${
              darkMode ? "border-purple-300" : "border-purple-900"
            }`}
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
          <div className="flex items-center gap-2">
            <BsCircleHalf size={36} className="text-purple-500" />
           <a href="/">
                <span className="text-2xl font-bold">LiquiDate</span>
            </a>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
           
          </nav>

          {/* Right Section (Visible Only on md and Up) */}
          <div className="hidden md:flex items-center gap-4 md:mr-32">
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

        <div className="container mx-auto px-4 py-8">
          <motion.div
            className="mb-8 text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              className={`inline-flex items-center gap-2 ${
                darkMode ? "bg-gray-800/50" : "bg-purple-200/50"
              } px-4 py-1 rounded-full`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span
                className={`text-sm font-medium ${
                  darkMode ? "text-purple-300" : "text-purple-900"
                }`}
              >
                Explore NFT Collections
              </span>
            </motion.div>

            <motion.h1
              className={`text-4xl font-bold ${
                darkMode ? "text-purple-400" : "text-purple-800"
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Popular Solana NFT Collections
            </motion.h1>

            <motion.p
              className={`${
                darkMode ? "text-gray-300" : "text-gray-700"
              } max-w-2xl mx-auto`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Discover trending NFT collections on Solana. Browse by different
              time periods to see what's hot right now.
            </motion.p>
          </motion.div>

          {/* Time Range Tabs */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            <div className="w-full max-w-md">
              <div
                className={`grid grid-cols-4 w-full rounded-full overflow-hidden ${
                  darkMode ? "bg-gray-800" : "bg-purple-200"
                }`}
              >
                {TIME_RANGES.map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 ${
                      selectedTimeRange === range
                        ? darkMode
                          ? "bg-purple-600 text-white"
                          : "bg-purple-700 text-white"
                        : darkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-purple-900 hover:bg-purple-300"
                    }`}
                  >
                    {getTimeRangeIcon(range)}
                    <span>{range.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    className={`overflow-hidden border ${
                      darkMode
                        ? "border-gray-700 bg-gray-800"
                        : "border-purple-200 bg-white"
                    }`}
                  >
                    <div className="h-48 bg-muted">
                      <Skeleton
                        className={`h-full w-full ${
                          darkMode ? "bg-gray-700" : "bg-purple-100"
                        }`}
                      />
                    </div>
                    <CardContent className="p-4">
                      <Skeleton
                        className={`h-5 w-3/4 mb-2 ${
                          darkMode ? "bg-gray-700" : "bg-purple-100"
                        }`}
                      />
                      <Skeleton
                        className={`h-4 w-1/2 mb-2 ${
                          darkMode ? "bg-gray-700" : "bg-purple-100"
                        }`}
                      />
                      <Skeleton
                        className={`h-4 w-2/3 ${
                          darkMode ? "bg-gray-700" : "bg-purple-100"
                        }`}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Error State */}
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
                <h3 className="font-semibold text-lg">
                  Error Loading Collections
                </h3>
                <p className="text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Collections Grid */}
          {!isLoading && !error && collections.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {collections.map((collection, index) => (
               
                <motion.div
                  key={collection.symbol}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Link
                    href={`/collection/${encodeURIComponent(
                      collection.symbol
                    )}`}
                    className="block h-full"
                  >
                    <Card
                      className={`overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl group rounded-xl ${
                        darkMode
                          ? "bg-gray-900 border border-gray-700"
                          : "bg-white border border-purple-200"
                      }`}
                    >
                      {/* IMAGE TOP */}
                      <div className="relative w-full aspect-square overflow-hidden">
                        <img
                          src={collection.image || "/placeholder-image.png"}
                          alt={collection.name || "Collection Image"}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== "/placeholder-image.png") {
                              target.src = "/placeholder-image.png";
                              target.alt = `${
                                collection.name || "Unnamed Collection"
                              } (Image unavailable)`;
                              target.style.objectFit = "contain";
                            }
                          }}
                        />
                        <Badge
                          className={`absolute top-2 right-2 z-10 ${
                            darkMode
                              ? "bg-purple-600 text-white"
                              : "bg-purple-700 text-white"
                          }`}
                        >
                          <TrendingUp className="mr-1 h-3 w-3" />
                          Trending
                        </Badge>
                      </div>

                      {/* CONTENT */}
                      <CardContent
                        className={`p-4 flex-grow ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        <h2
                          className="text-lg font-bold truncate group-hover:text-purple-500 transition-colors"
                          title={collection.name}
                        >
                          {collection.name || "Unnamed Collection"}
                        </h2>
                        {collection.symbol && (
                          <p
                            className="text-sm text-gray-400 mb-2 truncate"
                            title={collection.symbol}
                          >
                            Symbol: {collection.symbol}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <div className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
                          <span>
                            Floor:{" "}
                            <span className="font-semibold">
                              {formatFloorPrice(collection.floorPrice)} SOL
                            </span>
                          </span>
                        </div>
                      </CardContent>

                      {/* BUTTON */}
                      <CardFooter className="p-4 pt-0">
                        <Button
                          className={`w-full font-semibold ${
                            darkMode
                              ? "bg-purple-600 hover:bg-purple-700 text-white"
                              : "bg-purple-700 hover:bg-purple-800 text-white"
                          }`}
                        >
                          View Collection
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* No Collections State */}
          {!isLoading && !error && collections.length === 0 && (
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
                <Info
                  className={`h-10 w-10 ${
                    darkMode ? "text-purple-400" : "text-purple-500"
                  }`}
                />
              </div>
              <h3
                className={`text-xl font-semibold mb-2 ${
                  darkMode ? "text-purple-300" : "text-purple-800"
                }`}
              >
                No Collections Found
              </h3>
              <p
                className={`${
                  darkMode ? "text-gray-300" : "text-gray-600"
                } max-w-md mx-auto`}
              >
                No popular collections found for the selected time range. Try
                selecting a different time period.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
