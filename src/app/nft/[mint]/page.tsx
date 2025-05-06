'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { confirmTransaction } from '@/utils/actions';
import { 
  VersionedTransaction, 
  Connection,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import axios from 'axios';
import { toast } from 'sonner';

interface NftAttribute {
    trait_type: string;
    value: string | number;
}

interface NftData {
    mintAddress: string;
    owner: string;
    supply: number;
    collection: string;
    collectionName: string;
    name: string;
    updateAuthority: string;
    primarySaleHappened: boolean;
    sellerFeeBasisPoints: number;
    image: string;
    externalUrl?: string;
    attributes: NftAttribute[];
    properties: {
        files: { uri: string; type: string }[];
        category: string;
    };
    price?: number;
    listStatus?: string;
    tokenAddress?: string;
    priceInfo?: { solPrice?: { rawAmount: string; address: string; decimals: number; } };
}

interface TokenInfo {
    id: string;
    mintAddress: string;
    name: string;
    decimals: number;
}

interface JupiterPrice {
    id: string;
    price: string;
}

interface JupiterPriceResponse {
    data: { [key: string]: JupiterPrice; };
    timeTaken?: number;
}

// Jupiter API interfaces
interface QuoteResponse {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: string;
    slippageBps: number;
    routePlan: any[];
    contextSlot?: number;
    timeTaken?: number;
    priceImpactPct?: number;
    platformFee?: {
      amount: string;
      feeBps: number;
    };
}

interface SwapResponse {
    swapTransaction: string;  // Base64 encoded transaction
    lastValidBlockHeight?: number;
    prioritizationFeeLamports?: number;
    simulationError?: string;
}

const SUPPORTED_TOKENS: TokenInfo[] = [
    { id: 'SOL', mintAddress: 'So11111111111111111111111111111111111111112', name: 'Solana', decimals: 9 },
    { id: 'USDC', mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', name: 'USD Coin', decimals: 6 },
    { id: 'USDT', mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', name: 'Tether', decimals: 6 },
    { id: 'BONK', mintAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', name: 'Bonk', decimals: 5 },
    { id: 'TRUMP', mintAddress: '7n24dyXLrVLLu1qirxd4Y77noFy2Yn7F19gTqcW38kU5', name: 'TRUMP (Example)', decimals: 9 },
];

const SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112';

// Jupiter API endpoints (v6)
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';

async function isBlockhashExpired(connection: Connection, lastValidBlockHeight: number) {
  const currentBlockHeight = await connection.getBlockHeight('finalized');
  return (currentBlockHeight > lastValidBlockHeight - 150);
}

const formatNumber = (num: number | undefined | null, maxDecimals: number = 4): string => {
    if (num === undefined || num === null || isNaN(num)) return 'N/A';
    let decimals = maxDecimals;
    if (num > 1000) decimals = 2;
    if (num < 0.0001 && num > 0) decimals = 8;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimals });
};

const formatSolAmount = (lamports: string | number | undefined): string => {
    if (lamports === undefined || lamports === null) return "...";
    const amount = typeof lamports === "string" ? parseFloat(lamports) : lamports;
    if (isNaN(amount)) return "Error";
    return (amount / LAMPORTS_PER_SOL).toFixed(5);
};

async function getSolPriceInToken(targetTokenMint: string): Promise<number | null> {
    if (targetTokenMint === SOL_MINT_ADDRESS) return 1;
    try {
        const apiUrl = `https://lite-api.jup.ag/price/v2?ids=${SOL_MINT_ADDRESS}&vsToken=${targetTokenMint}`;
        const response = await axios.get<JupiterPriceResponse>(apiUrl);
        const priceData = response.data?.data?.[SOL_MINT_ADDRESS];
        if (priceData && typeof priceData.price === 'string') {
            const parsedPrice = parseFloat(priceData.price);
            return isNaN(parsedPrice) ? null : parsedPrice;
        }
        console.warn(`Could not find SOL price vs ${targetTokenMint} in response:`, response.data);
        return null;
    } catch (error: any) {
        console.error(`Error fetching SOL price vs ${targetTokenMint}:`, error.response?.data || error.message);
        return null;
    }
}

export default function NftDetailPage() {
    const router = useRouter();
    const params = useParams();
    const mint = params.mint as string;

    const { connection } = useConnection();
    const wallet = useWallet();
    const { publicKey, sendTransaction } = wallet;

    const [nftData, setNftData] = useState<NftData | null>(null);
    const [listingPriceSol, setListingPriceSol] = useState<number | null>(null);
    const [selectedTokenMint, setSelectedTokenMint] = useState<string>(SOL_MINT_ADDRESS);
    const [displayedPrice, setDisplayedPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);
    const [isBuying, setIsBuying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [buySuccessMessage, setBuySuccessMessage] = useState<string | null>(null);
    const [txId, setTxId] = useState<string | null>(null);
    
    // State for Jupiter swap
    const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
    const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
    const [quoteError, setQuoteError] = useState<string | null>(null);
    const [swapLoading, setSwapLoading] = useState<boolean>(false);
    const [swapSuccess, setSwapSuccess] = useState<boolean>(false);

    useEffect(() => {
        if (!mint) return;

        let isMounted = true;

        const fetchAndCalculatePrice = async () => {
            if (!nftData) setIsLoading(true);
            setIsLoadingPrice(true);
            setError(null);
            setDisplayedPrice(null);

            let currentListingPriceSol: number | null = listingPriceSol;

            if (!nftData || !listingPriceSol) {
                 try {
                    console.log("Fetching NFT details and SOL price...");
                    const detailsPromise = axios.get<NftData>(`https://api-mainnet.magiceden.dev/v2/tokens/${mint}`, { headers: { accept: 'application/json' } });
                    const listingPromise = axios.get(`https://api-mainnet.magiceden.dev/v2/tokens/${mint}/listings`, { headers: { accept: 'application/json' } });
                    const [detailsResponse, listingResponse] = await Promise.all([detailsPromise, listingPromise]);

                    if (!isMounted) return;

                    if (detailsResponse.status !== 200 || !detailsResponse.data) throw new Error('Failed to fetch NFT details');
                    setNftData(detailsResponse.data);

                    if (listingResponse.status === 200 && listingResponse.data && listingResponse.data.length > 0) {
                        currentListingPriceSol = parseFloat(listingResponse.data[0].price);
                        setListingPriceSol(currentListingPriceSol);
                        console.log("Fetched Listing Price (SOL):", currentListingPriceSol);
                    } else {
                        console.warn(`No active listings found for mint: ${mint}`);
                        currentListingPriceSol = detailsResponse.data.price ?? null;
                        setListingPriceSol(currentListingPriceSol);
                        if (currentListingPriceSol === null) setError("NFT may not be currently listed for sale.");
                    }
                 } catch (err: any) {
                    console.error("Error fetching NFT data:", err);
                    if (isMounted) setError(err.response?.data?.message || err.message || 'Failed to load NFT data.');
                    if (isMounted) setIsLoading(false);
                    if (isMounted) setIsLoadingPrice(false);
                    return;
                 } finally {
                    if (isMounted && !nftData) setIsLoading(false);
                 }
            } else {
                 console.log("Using cached SOL price:", currentListingPriceSol);
            }

            if (currentListingPriceSol !== null) {
                 console.log(`Calculating price for ${currentListingPriceSol} SOL in token ${selectedTokenMint}`);
                 if (selectedTokenMint === SOL_MINT_ADDRESS) {
                    if (isMounted) setDisplayedPrice(currentListingPriceSol);
                 } else {
                    const priceOfSolInSelectedToken = await getSolPriceInToken(selectedTokenMint);
                    if (!isMounted) return;
                    if (priceOfSolInSelectedToken !== null) {
                         const calculatedPrice = currentListingPriceSol * priceOfSolInSelectedToken;
                         setDisplayedPrice(calculatedPrice);
                         console.log(`Calculated display price: ${calculatedPrice}`);
                    } else {
                         setError("Could not calculate price for selected token.");
                         setDisplayedPrice(null);
                    }
                 }
            } else {
                 if (isMounted) setDisplayedPrice(null);
            }

            if (isMounted) setIsLoadingPrice(false);
        };

        fetchAndCalculatePrice();

        return () => { isMounted = false; };
    }, [mint, selectedTokenMint, nftData, listingPriceSol]);

    // Function to get Jupiter quote
    const fetchJupiterQuote = async (inputMint: string, outputMint: string, outputAmount: number): Promise<QuoteResponse | null> => {
        if (!inputMint || !outputMint || !outputAmount) {
            setQuoteError("Missing parameters for Jupiter quote");
            return null;
        }

        try {
            setQuoteLoading(true);
            setQuoteError(null);
            
            console.log(`Getting Jupiter quote for ${outputAmount} lamports of SOL using ${inputMint}`);
            
            const response = await axios.get(JUPITER_QUOTE_API, {
                params: {
                    inputMint: inputMint,
                    outputMint: outputMint,
                    amount: outputAmount.toString(),
                    swapMode: "ExactOut",      // We want exactly this amount of SOL
                    slippageBps: 100,          // 1% slippage tolerance
                    onlyDirectRoutes: false,
                    asLegacyTransaction: false
                }
            });

            console.log("Jupiter quote response:", response.data);
            setQuoteData(response.data);
            return response.data;
        } catch (err: any) {
            console.error("Error getting Jupiter quote:", err);
            const errorText = err instanceof Error ? err.message : "An unexpected error occurred.";
            setQuoteError(`Failed to fetch quote: ${errorText}`);
            toast.error(`Failed to fetch quote: ${errorText}`);
            setQuoteData(null);
            return null;
        } finally {
            setQuoteLoading(false);
        }
    };

    // Function to get Jupiter swap transaction
    const getJupiterSwapTransaction = async (quoteResponse: QuoteResponse): Promise<SwapResponse | null> => {
        if (!publicKey) {
            toast.error("Wallet not connected");
            return null;
        }

        try {
            console.log("Getting swap transaction from Jupiter");
            const response = await axios.post(JUPITER_SWAP_API, {
                quoteResponse,
                userPublicKey: publicKey.toString(),
                wrapAndUnwrapSol: true,
                dynamicComputeUnitLimit: true,
                prioritizationFeeLamports: "auto"
            });

            console.log("Jupiter swap response:", response.data);
            return response.data;
        } catch (err: any) {
            console.error("Error getting Jupiter swap transaction:", err);
            const errorText = err instanceof Error ? err.message : "An unexpected error occurred.";
            toast.error(`Failed to create swap transaction: ${errorText}`);
            return null;
        }
    };

    // Function to execute Jupiter swap
    const executeJupiterSwap = async (solLamportsNeeded: number): Promise<boolean> => {
        if (!publicKey || !sendTransaction) {
            toast.error("Please connect your wallet first");
            return false;
        }

        if (selectedTokenMint === SOL_MINT_ADDRESS) {
            console.log("Paying with SOL, no swap needed");
            return true; // No swap needed if paying with SOL
        }

        setSwapLoading(true);
        setSwapSuccess(false);
        let signature: string | null = null;

        try {
            // 1. Get fresh Jupiter quote
            toast.info("Getting best swap rate...");
            const quote = await fetchJupiterQuote(
                selectedTokenMint,
                SOL_MINT_ADDRESS,
                solLamportsNeeded
            );
            
            if (!quote) {
                throw new Error("Could not get a valid Jupiter quote");
            }

            // 2. Get swap transaction
            toast.info("Preparing swap transaction...");
            const swapResponse = await getJupiterSwapTransaction(quote);
            if (!swapResponse) {
                throw new Error("Could not get valid swap transaction");
            }

            // Check for simulation errors
            if (swapResponse.simulationError) {
                console.error("Swap simulation error:", swapResponse.simulationError);
                throw new Error(`Transaction simulation failed: ${swapResponse.simulationError}`);
            }

            // 3. Deserialize and send transaction
            const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, "base64");
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            
            // Show toast with transaction details
            toast.info(
                `Swapping approximately ${formatNumber(
                    parseInt(quote.inAmount) / Math.pow(10, SUPPORTED_TOKENS.find(t => t.mintAddress === selectedTokenMint)?.decimals || 9)
                )} ${SUPPORTED_TOKENS.find(t => t.mintAddress === selectedTokenMint)?.id || ''} for ${formatSolAmount(solLamportsNeeded)} SOL. Please approve in your wallet...`
            );
            
            // Send transaction
            signature = await sendTransaction(transaction, connection);
            setTxId(signature);
            
            // Show persistent toast while confirming
            const confirmToastId = `confirm-${signature}`;
            console.log("Swap Transaction Sent. Signature:", signature);
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
                { id: confirmToastId, duration: Infinity }
            );
            const blockHash = await connection.getLatestBlockhash();
            // Wait for confirmation
            try {
                const confirmation = await confirmTransaction(
                    signature,
                    blockHash.blockhash,
                    blockHash.lastValidBlockHeight
                );
                
                toast.dismiss(confirmToastId);
                
                if (!confirmation) {
                    throw new Error(`Transaction failed: ${JSON.stringify(confirmation)}`);
                }
                
                console.log("Swap transaction confirmed:", signature);
                toast.success("Swap successful! Proceeding to buy NFT...");
                setSwapSuccess(true);
                return true;
            } catch (confirmError: any) {
                toast.dismiss(confirmToastId);
                console.error("Confirmation Error:", confirmError);
                
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
                    ));
                } else {
                    toast.error(`Transaction confirmation failed: ${confirmError.message}`);
                }
                
                return false;
            }
        } catch (err: any) {
            console.error("Error executing Jupiter swap:", err);
            
            if (err.message?.includes("User rejected")) {
                toast.error("Transaction was rejected by the user");
            } else if (err.message?.includes("insufficient funds")) {
                toast.error("Insufficient funds for this swap");
            } else {
                toast.error(`Swap failed: ${err.message || "Unknown error"}`);
            }
            
            return false;
        } finally {
            setSwapLoading(false);
        }
    };

    const handleBuy = useCallback(async () => {
        if (!wallet.connected || !publicKey || !sendTransaction) {
            setError("Please connect your wallet and ensure it supports sendTransaction.");
            toast.error("Please connect your wallet.");
            return;
        }
        if (!mint || listingPriceSol === null || displayedPrice === null) {
            setError("NFT data or price is missing or invalid.");
            toast.error("NFT data or price is missing or invalid.");
            return;
        }
        if (!selectedTokenMint) {
            setError("Please select a payment token.");
            toast.error("Please select a payment token.");
            return;
        }

        setIsBuying(true);
        setError(null);
        setBuySuccessMessage(null);
        setTxId(null);
        
        try {
            // Calculate SOL needed in lamports
            const priceInLamports = Math.floor((listingPriceSol || 0) * LAMPORTS_PER_SOL);
            toast.info("Preparing to buy NFT...");
            
            // 1. First execute the swap if needed
            if (selectedTokenMint !== SOL_MINT_ADDRESS) {
                toast.info("Preparing token swap...");
                const swapSuccess = await executeJupiterSwap(priceInLamports);
                
                if (!swapSuccess) {
                    toast.error("Could not complete the token swap. Purchase cancelled.");
                    setIsBuying(false);
                    return;
                }
            }
            
            // 2. Now get the NFT purchase transaction from the backend
            toast.info("Preparing NFT purchase transaction...");
            
            const response = await fetch('/api/buy-nft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buyerAddress: publicKey.toBase58(),
                    mint: mint,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.transaction) {
                throw new Error(data.error || `Failed to get transaction data [${response.status}]`);
            }

            // 3. Execute the NFT purchase
            const buyTransactionBuf = Buffer.from(data.transaction, 'base64');
            const buyTransaction = VersionedTransaction.deserialize(buyTransactionBuf);
            
            toast.info("Please approve the NFT purchase in your wallet...");
            
            try {
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                
                const buySignature = await sendTransaction(buyTransaction, connection, {
                    skipPreflight: false,
                    preflightCommitment: "confirmed",
                });
                
                setTxId(buySignature);
                
                // Show persistent toast while confirming
                const buyToastId = `buy-${buySignature}`;
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
                    { id: buyToastId, duration: Infinity }
                );
                
                // Wait for confirmation
                try {
                    const confirmation = await connection.confirmTransaction({
                        signature: buySignature,
                        blockhash,
                        lastValidBlockHeight
                    }, "confirmed");
                    
                    toast.dismiss(buyToastId);
                    
                    if (confirmation.value.err) {
                        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
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
                    ));
                    
                    setBuySuccessMessage(`Purchase successful! Transaction: ${buySignature}`);
                } catch (confirmError: any) {
                    toast.dismiss(buyToastId);
                    console.error("Buy Confirmation Error:", confirmError);
                    
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
                        ));
                    } else {
                        toast.error(`Purchase confirmation failed: ${confirmError.message}`);
                    }
                    
                    setError(`Purchase confirmation failed: ${confirmError.message}`);
                }
            } catch (buyError: any) {
                console.error("NFT buy transaction error:", buyError);
                
                if (buyError.message?.includes("User rejected")) {
                    toast.error("Transaction was rejected by the user");
                } else if (buyError.message?.includes("insufficient funds")) {
                    toast.error("Insufficient funds for this purchase");
                } else {
                    toast.error(`Purchase failed: ${buyError.message || "Unknown error"}`);
                }
                
                setError(`Purchase failed: ${buyError.message || "Unknown error"}`);
            }
        } catch (err: any) {
            console.error("Overall buy process error:", err);
            toast.error(`Purchase error: ${err.message || "Unknown error"}`);
            setError(`Purchase error: ${err.message || "Unknown error"}`);
        } finally {
            setIsBuying(false);
        }
    }, [wallet, connection, mint, listingPriceSol, displayedPrice, selectedTokenMint, publicKey, sendTransaction]);

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen"><p>Loading NFT Details...</p></div>;
    }

     if (!isLoading && !nftData && error && !isBuying) {
         return (
             <div className="container mx-auto px-4 py-8 text-center">
                 <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading NFT</h1>
                 <p className="text-red-400 mb-4">{error}</p>
                 <button onClick={() => router.back()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Go Back</button>
             </div>
         );
     }

      if (!nftData && !isLoading) {
         return <div className="flex justify-center items-center min-h-screen"><p>Could not load NFT data.</p></div>;
     }

     const displayNftData = nftData || {} as Partial<NftData>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex justify-center items-start">
                    {displayNftData.image ? (
                        <img
                            src={displayNftData.image.replace("arweave.net", "arweave.net")}
                            alt={displayNftData.name || 'NFT Image'}
                            className="rounded-lg shadow-lg object-contain max-w-full h-auto"
                            loading="lazy"
                        />
                    ) : (
                         <div className="w-full max-w-[500px] aspect-square bg-gray-700 rounded-lg shadow-lg flex items-center justify-center">
                            <p className="text-gray-400">Loading Image...</p>
                         </div>
                    )}
                </div>

                <div>
                     <h1 className="text-3xl font-bold mb-2">{displayNftData.name || 'Loading...'}</h1>
                    <p className="text-lg text-gray-400 mb-4">Collection: <span className="font-semibold text-blue-400">{displayNftData.collectionName || '...'}</span></p>

                     <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
                         <h2 className="text-xl font-semibold mb-4">Purchase Options</h2>

                         {listingPriceSol !== null ? (
                             <>
                                 <p className="text-2xl font-bold mb-3">
                                     Price: {formatNumber(listingPriceSol)} SOL
                                 </p>

                                 <div className="mb-4">
                                     <label htmlFor="tokenSelect" className="block text-sm font-medium text-gray-300 mb-1">Pay with:</label>
                                     <select
                                         id="tokenSelect"
                                         value={selectedTokenMint}
                                         onChange={(e) => setSelectedTokenMint(e.target.value)}
                                         className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
                                         disabled={isBuying || isLoadingPrice}
                                     >
                                         {SUPPORTED_TOKENS.map(token => (
                                             <option key={token.mintAddress} value={token.mintAddress} >
                                                 {token.name} ({token.id})
                                             </option>
                                         ))}
                                     </select>
                                 </div>

                                 <p className="text-xl font-semibold mb-4">
                                     ≈ {isLoadingPrice ? 'Calculating...' : formatNumber(displayedPrice)} {SUPPORTED_TOKENS.find(t => t.mintAddress === selectedTokenMint)?.id || ''}
                                 </p>

                                 <button
                                     onClick={handleBuy}
                                     disabled={!wallet.connected || isBuying || isLoadingPrice || listingPriceSol === null || displayedPrice === null}
                                     className={`w-full px-6 py-3 text-lg font-semibold rounded transition-colors duration-200 ${
                                         (!wallet.connected || isBuying || isLoadingPrice || listingPriceSol === null || displayedPrice === null)
                                             ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                             : 'bg-blue-600 hover:bg-blue-700 text-white'
                                     }`}
                                 >
                                     {isBuying ? 
                                         (swapLoading ? 'Processing Swap...' : 'Processing Purchase...') 
                                         : isLoadingPrice ? 'Calculating Price...' 
                                         : (wallet.connected ? `Buy Now` : 'Connect Wallet to Buy')}
                                 </button>
                                 
                                 {txId && (
                                    <div className="mt-4 text-center text-sm">
                                        <a
                                            href={`https://solscan.io/tx/${txId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:underline"
                                        >
                                            View transaction on Solscan
                                        </a>
                                    </div>
                                 )}
                                 
                                 {buySuccessMessage && (
                                    <div className="mt-4 text-center text-sm text-green-400">
                                        {buySuccessMessage}
                                    </div>
                                 )}
                            </>
                        ) : (
                             <p className="text-xl text-yellow-500">{ error || 'Listing price unavailable.'}</p>
                         )}

                         {error && !isBuying && <p className="mt-4 text-red-500 text-sm">{error}</p>}
                     </div>

                    {displayNftData.attributes && displayNftData.attributes.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">Attributes</h3>
                            <div className="flex flex-wrap gap-2">
                                {displayNftData.attributes.map((attr, index) => (
                                    <div key={index} className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                                        <span className="font-medium text-gray-300">{attr.trait_type}: </span>
                                        <span className="text-white">{attr.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-sm text-gray-400 space-y-1">
                         {displayNftData.owner && <p>Owner: <a href={`https://solscan.io/account/${displayNftData.owner}`} target="_blank" rel="noopener noreferrer" className="underline truncate w-40 inline-block">{displayNftData.owner}</a></p>}
                         {displayNftData.mintAddress && <p>Mint Address: <a href={`https://solscan.io/token/${displayNftData.mintAddress}`} target="_blank" rel="noopener noreferrer" className="underline truncate w-40 inline-block">{displayNftData.mintAddress}</a></p>}
                         {displayNftData.tokenAddress && <p>Token Account: <a href={`https://solscan.io/account/${displayNftData.tokenAddress}`} target="_blank" rel="noopener noreferrer" className="underline truncate w-40 inline-block">{displayNftData.tokenAddress}</a></p>}
                         {displayNftData.externalUrl && <p>External URL: <a href={displayNftData.externalUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">{displayNftData.externalUrl}</a></p>}
                     </div>
                </div>
            </div>
        </div>
    );
}