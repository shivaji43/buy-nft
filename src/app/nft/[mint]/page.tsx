


"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { confirmTransaction } from "@/utils/actions"
import { VersionedTransaction, type Connection, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { motion } from "framer-motion"
import axios from "axios"
import { toast } from "sonner"
import Link from "next/link"
import { FaBars, FaTimes } from "react-icons/fa";
import { CircleIcon, Twitter, Github, Sun, Moon, ArrowLeft, ExternalLink, Copy, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {   FaGithub, FaSun, FaMoon } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { BsCircleHalf } from "react-icons/bs"

interface NftAttribute {
  trait_type: string
  value: string | number
}

interface NftData {
  mintAddress: string
  owner: string
  supply: number
  collection: string
  collectionName: string
  name: string
  updateAuthority: string
  primarySaleHappened: boolean
  sellerFeeBasisPoints: number
  image: string
  externalUrl?: string
  attributes: NftAttribute[]
  properties: {
    files: { uri: string; type: string }[]
    category: string
  }
  price?: number
  listStatus?: string
  tokenAddress?: string
  priceInfo?: {
    solPrice?: { rawAmount: string; address: string; decimals: number }
  }
}

interface TokenInfo {
  id: string
  mintAddress: string
  name: string
  decimals: number
}

interface JupiterPrice {
  id: string
  price: string
}

interface JupiterPriceResponse {
  data: { [key: string]: JupiterPrice }
  timeTaken?: number
}

interface QuoteResponse {
  inputMint: string
  outputMint: string
  inAmount: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  slippageBps: number
  routePlan: any[]
  contextSlot?: number
  timeTaken?: number
  priceImpactPct?: number
  platformFee?: {
    amount: string
    feeBps: number
  }
  userPublicKey?: string
}

interface SwapResponse {
  swapTransaction: string
  lastValidBlockHeight?: number
  prioritizationFeeLamports?: number
  simulationError?: string
}

const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    id: "SOL",
    mintAddress: "So11111111111111111111111111111111111111112",
    name: "Solana",
    decimals: 9,
  },
  {
    id: "USDC",
    mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    name: "USD Coin",
    decimals: 6,
  },
  {
    id: "USDT",
    mintAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    name: "Tether",
    decimals: 6,
  },
  {
    id: "BONK",
    mintAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    name: "Bonk",
    decimals: 5,
  },
  {
    id: "TRUMP",
    mintAddress: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
    name: "TRUMP",
    decimals: 9,
  },
]

const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112"

const JUPITER_QUOTE_API = "https://lite-api.jup.ag/swap/v1/quote"
const JUPITER_SWAP_API = "https://lite-api.jup.ag/swap/v1/swap"

async function isBlockhashExpired(connection: Connection, lastValidBlockHeight: number) {
  const currentBlockHeight = await connection.getBlockHeight("finalized")
  return currentBlockHeight > lastValidBlockHeight - 150
}

const formatNumber = (num: number | undefined | null, maxDecimals = 4): string => {
  if (num === undefined || num === null || isNaN(num)) return "N/A"
  let decimals = maxDecimals
  if (num > 1000) decimals = 2
  if (num < 0.0001 && num > 0) decimals = 8
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  })
}

const formatSolAmount = (lamports: string | number | undefined): string => {
  if (lamports === undefined || lamports === null) return "..."
  const amount = typeof lamports === "string" ? Number.parseFloat(lamports) : lamports
  if (isNaN(amount)) return "Error"
  return (amount / LAMPORTS_PER_SOL).toFixed(5)
}

async function getSolPriceInToken(targetTokenMint: string): Promise<number | null> {
  if (targetTokenMint === SOL_MINT_ADDRESS) return 1
  try {
    const apiUrl = `https://lite-api.jup.ag/price/v2?ids=${SOL_MINT_ADDRESS}&vsToken=${targetTokenMint}`
    const response = await axios.get<JupiterPriceResponse>(apiUrl)
    const priceData = response.data?.data?.[SOL_MINT_ADDRESS]
    if (priceData && typeof priceData.price === "string") {
      const parsedPrice = Number.parseFloat(priceData.price)
      return isNaN(parsedPrice) ? null : parsedPrice
    }
    console.warn(`Could not find SOL price vs ${targetTokenMint} in response:`, response.data)
    return null
  } catch (error: any) {
    console.error(`Error fetching SOL price vs ${targetTokenMint}:`, error.response?.data || error.message)
    return null
  }
}

export default function NftDetailPage() {
  const router = useRouter()
  const params = useParams()
  const mint = params.mint as string

  const { connection } = useConnection()
  const wallet = useWallet()
  const { publicKey, sendTransaction, connected } = wallet
const [menuOpen, setMenuOpen] = useState(false);
  const [nftData, setNftData] = useState<NftData | null>(null)
  const [listingPriceSol, setListingPriceSol] = useState<number | null>(null)
  const [selectedTokenMint, setSelectedTokenMint] = useState<string>(SOL_MINT_ADDRESS)
  const [displayedPrice, setDisplayedPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buySuccessMessage, setBuySuccessMessage] = useState<string | null>(null)
  const [txId, setTxId] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const [quoteLoading, setQuoteLoading] = useState<boolean>(false)
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [swapLoading, setSwapLoading] = useState<boolean>(false)
  const [swapSuccess, setSwapSuccess] = useState<boolean>(false)

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

  useEffect(() => {
    if (!mint) return
    let isMounted = true
    const fetchAndCalculatePrice = async () => {
      if (!nftData) setIsLoading(true)
      setIsLoadingPrice(true)
      setError(null)
      setDisplayedPrice(null)
      let currentListingPriceSol: number | null = listingPriceSol

      if (!nftData || !listingPriceSol) {
        try {
          const detailsPromise = axios.get<NftData>(`https://api-mainnet.magiceden.dev/v2/tokens/${mint}`, {
            headers: { accept: "application/json" },
          })
          const listingPromise = axios.get(`https://api-mainnet.magiceden.dev/v2/tokens/${mint}/listings`, {
            headers: { accept: "application/json" },
          })
          const [detailsResponse, listingResponse] = await Promise.all([detailsPromise, listingPromise])

          if (!isMounted) return

          if (detailsResponse.status !== 200 || !detailsResponse.data) throw new Error("Failed to fetch NFT details")
          setNftData(detailsResponse.data)

          if (listingResponse.status === 200 && listingResponse.data && listingResponse.data.length > 0) {
            currentListingPriceSol = Number.parseFloat(listingResponse.data[0].price)
            setListingPriceSol(currentListingPriceSol)
          } else {
            console.warn(`No active listings found for mint: ${mint}`)
            currentListingPriceSol = detailsResponse.data.price ?? null
            setListingPriceSol(currentListingPriceSol)
            if (currentListingPriceSol === null) setError("NFT may not be currently listed for sale.")
          }
        } catch (err: any) {
          console.error("Error fetching NFT data:", err)
          if (isMounted) setError(err.response?.data?.message || err.message || "Failed to load NFT data.")
          if (isMounted) setIsLoading(false)
          if (isMounted) setIsLoadingPrice(false)
          return
        } finally {
          if (isMounted && !nftData) setIsLoading(false)
        }
      }

      if (currentListingPriceSol !== null) {
        if (selectedTokenMint === SOL_MINT_ADDRESS) {
          if (isMounted) setDisplayedPrice(currentListingPriceSol)
        } else {
          const priceOfSolInSelectedToken = await getSolPriceInToken(selectedTokenMint)
          if (!isMounted) return
          if (priceOfSolInSelectedToken !== null) {
            const calculatedPrice = currentListingPriceSol * priceOfSolInSelectedToken
            setDisplayedPrice(calculatedPrice)
          } else {
            setError("Could not calculate price for selected token.")
            setDisplayedPrice(null)
          }
        }
      } else {
        if (isMounted) setDisplayedPrice(null)
      }
      if (isMounted) setIsLoadingPrice(false)
    }
    fetchAndCalculatePrice()
    return () => {
      isMounted = false
    }
  }, [mint, selectedTokenMint, nftData, listingPriceSol])

  const fetchJupiterQuote = async (
    inputMint: string,
    outputMint: string,
    outputAmount: number,
  ): Promise<QuoteResponse | null> => {
    if (!inputMint || !outputMint || !outputAmount) {
      setQuoteError("Missing parameters for Jupiter quote")
      return null
    }
    if (!publicKey) {
      toast.error("Wallet not connected for quote")
      return null
    }
    try {
      setQuoteLoading(true)
      setQuoteError(null)
      const response = await axios.get(JUPITER_QUOTE_API, {
        params: {
          inputMint: inputMint,
          outputMint: outputMint,
          amount: outputAmount.toString(),
          swapMode: "ExactOut",
          slippageBps: 100,
          onlyDirectRoutes: false,
          asLegacyTransaction: false,
          userPublicKey: publicKey.toString(),
        },
      })
      setQuoteData(response.data)
      return response.data
    } catch (err: any) {
      console.error("Error getting Jupiter quote:", err)
      const errorText = err instanceof Error ? err.message : "An unexpected error occurred."
      setQuoteError(`Failed to fetch quote: ${errorText}`)
      toast.error(`Failed to fetch quote: ${errorText}`)
      setQuoteData(null)
      return null
    } finally {
      setQuoteLoading(false)
    }
  }

  const getJupiterSwapTransaction = async (quoteResponse: QuoteResponse): Promise<SwapResponse | null> => {
    if (!publicKey) {
      toast.error("Wallet not connected for swap transaction")
      return null
    }
    try {
      const response = await axios.post(JUPITER_SWAP_API, {
        quoteResponse,
        userPublicKey: publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      })
      return response.data
    } catch (err: any) {
      console.error("Error getting Jupiter swap transaction:", err)
      const errorText = err instanceof Error ? err.message : "An unexpected error occurred."
      toast.error(`Failed to create swap transaction: ${errorText}`)
      return null
    }
  }

  const executeJupiterSwap = async (solLamportsNeeded: number): Promise<boolean> => {
    if (!publicKey || !sendTransaction) {
      toast.error("Please connect your wallet first")
      return false
    }
    if (selectedTokenMint === SOL_MINT_ADDRESS) {
      return true
    }
    setSwapLoading(true)
    setSwapSuccess(false)
    let signature: string | null = null

    try {
      toast.info("Getting best swap rate...")
      const quote = await fetchJupiterQuote(selectedTokenMint, SOL_MINT_ADDRESS, solLamportsNeeded)
      if (!quote) {
        throw new Error("Could not get a valid Jupiter quote")
      }

      toast.info("Preparing swap transaction...")
      const swapResponse = await getJupiterSwapTransaction(quote)
      if (!swapResponse) {
        throw new Error("Could not get valid swap transaction")
      }
      if (swapResponse.simulationError) {
        console.error("Swap simulation error:", swapResponse.simulationError)
        throw new Error(`Transaction simulation failed: ${swapResponse.simulationError}`)
      }

      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, "base64")
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf)

      if (!publicKey) {
        toast.error("Swap Error: Wallet not connected or publicKey is null before sending!")
        setSwapLoading(false)
        return false
      }
      console.log("[SWAP] Attempting to send transaction.")
      console.log("[SWAP] Connected Wallet (Expected Payer):", publicKey.toBase58())

      toast.info(
        `Swapping approximately ${formatNumber(
          Number.parseInt(quote.inAmount) /
            Math.pow(10, SUPPORTED_TOKENS.find((t) => t.mintAddress === selectedTokenMint)?.decimals || 9),
        )} ${
          SUPPORTED_TOKENS.find((t) => t.mintAddress === selectedTokenMint)?.id || ""
        } for ${formatSolAmount(solLamportsNeeded)} SOL. Please approve in your wallet...`,
      )
      console.log("Here is the Publickey", wallet.publicKey?.toBase58())

      signature = await sendTransaction(transaction, connection)
      setTxId(signature)

      const confirmToastId = `confirm-${signature}`
      toast.info(
        () => (
          <div>
            Transaction Sent! Waiting for confirmation...
            <br />
            <a
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              View on Solscan
            </a>
          </div>
        ),
        { id: confirmToastId, duration: Number.POSITIVE_INFINITY },
      )
      const blockHash = await connection.getLatestBlockhash()
      try {
        const confirmation = await confirmTransaction(signature, blockHash.blockhash, blockHash.lastValidBlockHeight)
        toast.dismiss(confirmToastId)
        if (!confirmation) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation)}`)
        }
        toast.success("Swap successful! Proceeding to buy NFT...")
        setSwapSuccess(true)
        return true
      } catch (confirmError: any) {
        toast.dismiss(confirmToastId)
        console.error("Confirmation Error:", confirmError)
        if (confirmError.message?.includes("timeout") || confirmError.message?.includes("timed out")) {
          toast.error(() => (
            <div>
              Confirmation timed out. Transaction may still succeed.
              <br />
              <a
                href={`https://solscan.io/tx/${signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View on Solscan
              </a>
            </div>
          ))
        } else {
          toast.error(`Transaction confirmation failed: ${confirmError.message}`)
        }
        return false
      }
    } catch (err: any) {
      console.error("Error executing Jupiter swap:", err)
      if (err.message?.includes("User rejected")) {
        toast.error("Transaction was rejected by the user")
      } else if (err.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds for this swap")
      } else {
        toast.error(`Swap failed: ${err.message || "Unknown error"}`)
      }
      return false
    } finally {
      setSwapLoading(false)
    }
  }

  const handleBuy = useCallback(async () => {
    if (!wallet.connected || !publicKey || !sendTransaction) {
      setError("Please connect your wallet and ensure it supports sendTransaction.")
      toast.error("Please connect your wallet.")
      return
    }
    if (!mint || listingPriceSol === null || displayedPrice === null) {
      setError("NFT data or price is missing or invalid.")
      toast.error("NFT data or price is missing or invalid.")
      return
    }
    if (!selectedTokenMint) {
      setError("Please select a payment token.")
      toast.error("Please select a payment token.")
      return
    }

    setIsBuying(true)
    setError(null)
    setBuySuccessMessage(null)
    setTxId(null)

    try {
      const priceInLamports = Math.floor((listingPriceSol || 0) * LAMPORTS_PER_SOL)
      toast.info("Preparing to buy NFT...")

      if (selectedTokenMint !== SOL_MINT_ADDRESS) {
        toast.info("Preparing token swap...")
        const swapSuccessful = await executeJupiterSwap(priceInLamports)
        if (!swapSuccessful) {
          toast.error("Could not complete the token swap. Purchase cancelled.")
          setIsBuying(false)
          return
        }
      }

      toast.info("Preparing NFT purchase transaction...")
      const response = await fetch("/api/buy-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerAddress: publicKey.toBase58(),
          mint: mint,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.transaction) {
        throw new Error(data.error || `Failed to get transaction data [${response.status}]`)
      }

      const buyTransactionBuf = Buffer.from(data.transaction, "base64")
      const buyTransaction = VersionedTransaction.deserialize(buyTransactionBuf)

      if (!publicKey) {
        toast.error("Buy Error: Wallet not connected or publicKey is null before sending!")
        setIsBuying(false)
        return
      }
      console.log("[BUY NFT] Attempting to send transaction.")
      console.log("[BUY NFT] Connected Wallet (Expected Payer):", publicKey.toBase58())
      toast.info("Please approve the NFT purchase in your wallet...")

      try {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        const buySignature = await sendTransaction(buyTransaction, connection, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        })
        setTxId(buySignature)

        const buyToastId = `buy-${buySignature}`
        toast.info(
          () => (
            <div>
              NFT Purchase Sent! Waiting for confirmation...
              <br />
              <a
                href={`https://solscan.io/tx/${buySignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View on Solscan
              </a>
            </div>
          ),
          { id: buyToastId, duration: Number.POSITIVE_INFINITY },
        )

        try {
          const confirmation = await connection.confirmTransaction(
            {
              signature: buySignature,
              blockhash,
              lastValidBlockHeight,
            },
            "confirmed",
          )
          toast.dismiss(buyToastId)
          if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
          }
          toast.success(() => (
            <div>
              NFT Purchase Successful! 🎉
              <br />
              <a
                href={`https://solscan.io/tx/${buySignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View on Solscan
              </a>
            </div>
          ))
          setBuySuccessMessage(`Purchase successful! Transaction: ${buySignature}`)
        } catch (confirmError: any) {
          toast.dismiss(buyToastId)
          console.error("Buy Confirmation Error:", confirmError)
          if (confirmError.message?.includes("timeout") || confirmError.message?.includes("timed out")) {
            toast.error(() => (
              <div>
                Confirmation timed out. Transaction may still succeed.
                <br />
                <a
                  href={`https://solscan.io/tx/${buySignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View on Solscan
                </a>
              </div>
            ))
          } else {
            toast.error(`Purchase confirmation failed: ${confirmError.message}`)
          }
          setError(`Purchase confirmation failed: ${confirmError.message}`)
        }
      } catch (buyError: any) {
        console.error("NFT buy transaction error:", buyError)
        if (buyError.message?.includes("User rejected")) {
          toast.error("Transaction was rejected by the user")
        } else if (buyError.message?.includes("insufficient funds")) {
          toast.error("Insufficient funds for this purchase")
        } else {
          toast.error(`Purchase failed: ${buyError.message || "Unknown error"}`)
        }
        setError(`Purchase failed: ${buyError.message || "Unknown error"}`)
      }
    } catch (err: any) {
      console.error("Overall buy process error:", err)
      toast.error(`Purchase error: ${err.message || "Unknown error"}`)
      setError(`Purchase error: ${err.message || "Unknown error"}`)
    } finally {
      setIsBuying(false)
    }
  }, [wallet, connection, mint, listingPriceSol, displayedPrice, selectedTokenMint, publicKey, sendTransaction])

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAddress(type)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const truncateAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isLoading) {
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

        <div className="relative z-10 flex justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className={`text-xl font-medium ${darkMode ? "text-purple-300" : "text-purple-800"}`}>
              Loading NFT Details...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoading && !nftData && error && !isBuying) {
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

        <div className="relative z-10 container mx-auto px-4 py-8 text-center flex flex-col items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`p-8 rounded-lg shadow-lg ${
              darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-purple-200"
            } max-w-md mx-auto`}
          >
            <h1 className={`text-2xl font-bold mb-4 ${darkMode ? "text-red-400" : "text-red-600"}`}>
              Error Loading NFT
            </h1>
            <p className={`mb-6 ${darkMode ? "text-red-300" : "text-red-500"}`}>{error}</p>
            <Button
              onClick={() => router.back()}
              className={`${
                darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-700 hover:bg-purple-800"
              } text-white px-6 py-2 rounded-full transition-colors`}
            >
              Go Back
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!nftData && !isLoading) {
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

        <div className="relative z-10 flex justify-center items-center min-h-screen">
          <p className={`text-xl font-medium ${darkMode ? "text-purple-300" : "text-purple-800"}`}>
            Could not load NFT data.
          </p>
        </div>
      </div>
    )
  }

  const displayNftData = nftData || ({} as Partial<NftData>)

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <motion.div
              className="flex justify-center items-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Card
                className={`overflow-hidden ${
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-200"
                } shadow-xl rounded-xl`}
              >
                {displayNftData.image ? (
                  <img
                    src={displayNftData.image.replace("arweave.net", "arweave.net") || "/placeholder.svg"}
                    alt={displayNftData.name || "NFT Image"}
                    className="rounded-lg object-contain max-w-full h-auto"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full max-w-[500px] aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Loading Image...</p>
                  </div>
                )}
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <motion.h1
                className={`text-3xl font-bold mb-2 ${darkMode ? "text-purple-300" : "text-purple-800"}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {displayNftData.name || "Loading..."}
              </motion.h1>

              <motion.p
                className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-700"} mb-4`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Collection:{" "}
                <span className={`font-semibold ${darkMode ? "text-purple-400" : "text-purple-700"}`}>
                  {displayNftData.collectionName || "..."}
                </span>
              </motion.p>

              <motion.div
                className={`p-6 rounded-xl shadow-md mb-6 ${
                  darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-purple-200"
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-purple-300" : "text-purple-800"}`}>
                  Purchase Options
                </h2>

                {listingPriceSol !== null ? (
                  <>
                    <p className={`text-2xl font-bold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                      Price: {formatNumber(listingPriceSol)} SOL
                    </p>

                    <div className="mb-4">
                      <label
                        htmlFor="tokenSelect"
                        className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}
                      >
                        Pay with:
                      </label>
                      <select
                        id="tokenSelect"
                        value={selectedTokenMint}
                        onChange={(e) => setSelectedTokenMint(e.target.value)}
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                        }`}
                        disabled={isBuying || isLoadingPrice}
                      >
                        {SUPPORTED_TOKENS.map((token) => (
                          <option key={token.mintAddress} value={token.mintAddress}>
                            {token.name} ({token.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className={`text-xl font-semibold mb-4 ${darkMode ? "text-purple-300" : "text-purple-700"}`}>
                      ≈{" "}
                      {isLoadingPrice ? (
                        <span className="inline-flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Calculating...
                        </span>
                      ) : (
                        formatNumber(displayedPrice)
                      )}{" "}
                      {SUPPORTED_TOKENS.find((t) => t.mintAddress === selectedTokenMint)?.id || ""}
                    </p>

                    <Button
                      onClick={handleBuy}
                      disabled={
                        !wallet.connected ||
                        isBuying ||
                        isLoadingPrice ||
                        listingPriceSol === null ||
                        displayedPrice === null
                      }
                      className={`w-full px-6 py-6 text-lg font-semibold rounded-full transition-colors duration-200 ${
                        !wallet.connected ||
                        isBuying ||
                        isLoadingPrice ||
                        listingPriceSol === null ||
                        displayedPrice === null
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : darkMode
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-purple-700 hover:bg-purple-800 text-white"
                      }`}
                    >
                      {isBuying ? (
                        <span className="inline-flex items-center">
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          {swapLoading ? "Processing Swap..." : "Processing Purchase..."}
                        </span>
                      ) : isLoadingPrice ? (
                        <span className="inline-flex items-center">
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Calculating Price...
                        </span>
                      ) : wallet.connected ? (
                        `Buy Now`
                      ) : (
                        "Connect Wallet to Buy"
                      )}
                    </Button>

                    {txId && (
                      <div className="mt-4 text-center text-sm">
                        <a
                          href={`https://solscan.io/tx/${txId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center ${
                            darkMode ? "text-purple-400" : "text-purple-600"
                          } hover:underline`}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View transaction on Solscan
                        </a>
                      </div>
                    )}

                    {buySuccessMessage && (
                      <div
                        className={`mt-4 p-3 rounded-lg ${
                          darkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {buySuccessMessage}
                      </div>
                    )}
                  </>
                ) : (
                  <p className={`text-xl ${darkMode ? "text-yellow-300" : "text-yellow-600"}`}>
                    {error || "Listing price unavailable."}
                  </p>
                )}

                {error && !isBuying && (
                  <p className={`mt-4 ${darkMode ? "text-red-400" : "text-red-500"} text-sm`}>{error}</p>
                )}
              </motion.div>

              {displayNftData.attributes && displayNftData.attributes.length > 0 && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-purple-300" : "text-purple-800"}`}>
                    Attributes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {displayNftData.attributes.map((attr, index) => (
                      <Badge
                        key={index}
                        className={`px-3 py-1 ${
                          darkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-purple-100 hover:bg-purple-200 text-purple-800"
                        }`}
                        variant="outline"
                      >
                        <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                          {attr.trait_type}:{" "}
                        </span>
                        <span>{attr.value}</span>
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} space-y-2`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                {displayNftData.owner && (
                  <div className="flex items-center">
                    <span className="mr-2">Owner:</span>
                    <div className="flex items-center">
                      <a
                        href={`https://solscan.io/account/${displayNftData.owner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`underline truncate ${darkMode ? "text-purple-400" : "text-purple-600"}`}
                      >
                        {truncateAddress(displayNftData.owner)}
                      </a>
                      <button
                        onClick={() => copyToClipboard(displayNftData.owner || "", "owner")}
                        className={`ml-1 p-1 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"}`}
                        title="Copy address"
                      >
                        {copiedAddress === "owner" ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {displayNftData.mintAddress && (
                  <div className="flex items-center">
                    <span className="mr-2">Mint Address:</span>
                    <div className="flex items-center">
                      <a
                        href={`https://solscan.io/token/${displayNftData.mintAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`underline truncate ${darkMode ? "text-purple-400" : "text-purple-600"}`}
                      >
                        {truncateAddress(displayNftData.mintAddress)}
                      </a>
                      <button
                        onClick={() => copyToClipboard(displayNftData.mintAddress || "", "mint")}
                        className={`ml-1 p-1 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"}`}
                        title="Copy address"
                      >
                        {copiedAddress === "mint" ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {displayNftData.tokenAddress && (
                  <div className="flex items-center">
                    <span className="mr-2">Token Account:</span>
                    <div className="flex items-center">
                      <a
                        href={`https://solscan.io/account/${displayNftData.tokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`underline truncate ${darkMode ? "text-purple-400" : "text-purple-600"}`}
                      >
                        {truncateAddress(displayNftData.tokenAddress)}
                      </a>
                      <button
                        onClick={() => copyToClipboard(displayNftData.tokenAddress || "", "token")}
                        className={`ml-1 p-1 rounded-full ${darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"}`}
                        title="Copy address"
                      >
                        {copiedAddress === "token" ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {displayNftData.externalUrl && (
                  <div className="flex items-center">
                    <span className="mr-2">External URL:</span>
                    <a
                      href={displayNftData.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`underline flex items-center ${darkMode ? "text-purple-400" : "text-purple-600"}`}
                    >
                      <span>View</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

