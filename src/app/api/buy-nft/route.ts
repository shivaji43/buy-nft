import { NextRequest, NextResponse } from "next/server";
import axios from 'axios';
import {
  PublicKey,
  Connection,
  VersionedTransaction,
} from "@solana/web3.js";
import { unstable_noStore as noStore } from "next/cache";

export async function POST(req: NextRequest) {
  noStore();

  try {
    const { buyerAddress, mint } = await req.json();

    if (!buyerAddress || !mint) {
      return NextResponse.json(
        { error: "Missing required parameters: buyerAddress, mint" },
        { status: 400 }
      );
    }

    const buyer = new PublicKey(buyerAddress);

    const endpoint = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
    const connection = new Connection(endpoint, "confirmed");
    const bearerToken = process.env.MAGIC_EDEN_API_KEY;

    if (!bearerToken) {
        console.error("MAGIC_EDEN_API_KEY is not set in environment variables.");
        return NextResponse.json({ error: "Server configuration error: Missing API Key" }, { status: 500 });
    }

    // --- 1. Fetch NFT Listing Details from Magic Eden ---
    let listingData: any;
    let auctionHouseAddress: string = ''; // Default to empty string
    let seller: string = '';
    let priceInSol: number = 0;
    let tokenATA: string = '';
    let sellerExpiry: number = 0;

    try {
      console.log(`Fetching listing for mint: ${mint}`);
      const listingResponse = await axios.get(
        `https://api-mainnet.magiceden.dev/v2/tokens/${mint}/listings`,
        { headers: { Accept: "application/json", Authorization: `Bearer ${bearerToken}` } }
      );

      if (!listingResponse.data || listingResponse.data.length === 0) {
         console.log(`No listings found for mint: ${mint}`);
        return NextResponse.json({ error: "NFT is not listed for sale." }, { status: 404 });
      }

      listingData = listingResponse.data[0];
      console.log("Raw Listing Data:", JSON.stringify(listingData, null, 2));

      // --- Extract Data ---
      auctionHouseAddress = listingData.auctionHouse || '';
      seller = listingData.seller || '';
      priceInSol = parseFloat(listingData.price);
      tokenATA = listingData.tokenAddress || '';
      sellerExpiry = parseInt(listingData.expiry) || -1;

      // --- Basic Validation ---
      if (isNaN(priceInSol) || !seller || !tokenATA) {
          console.error("Incomplete critical listing data:", listingData);
          throw new Error("Missing critical NFT listing data (seller, price, tokenAddress)");
      }
      console.log(`Listing details extracted. AuctionHouse: "${auctionHouseAddress}", Seller: ${seller}, Price: ${priceInSol}, TokenATA: ${tokenATA}`);

    } catch (error: any) {
      console.error("Error fetching/processing NFT listing data:", error.response?.data || error.message, error);
      const detail = error.response?.data?.message || error.message;
      return NextResponse.json(
        { error: `Failed to fetch NFT listing data: ${detail}` },
        { status: 500 }
      );
    }

    // --- 2. Prepare Magic Eden Buy Transaction (Using /v2/instructions/buy_now only) ---
    try {
        console.log(`Preparing ME buy_now instruction. AH: "${auctionHouseAddress}"`);
        const meApiEndpoint = `https://api-mainnet.magiceden.dev/v2/instructions/buy_now`;
        
        const params = {
            buyer: buyer.toString(),
            seller: seller.toString(),
            auctionHouseAddress: auctionHouseAddress,
            tokenMint: mint,
            tokenATA: tokenATA,
            price: priceInSol.toString(),
            sellerExpiry: sellerExpiry,
        };

        console.log("Calling buy_now with params:", params);
        const buyIxResponse = await axios.get(meApiEndpoint, {
            headers: { Authorization: `Bearer ${bearerToken}`, Accept: "application/json" },
            params: params
        });

        console.log("ME buy_now response status:", buyIxResponse.status);
        console.log("ME buy_now response data:", buyIxResponse.data);

        if (!buyIxResponse.data?.txSigned?.data) {
            console.error("Invalid response structure from Magic Eden buy_now:", buyIxResponse.data);
            throw new Error("Magic Eden buy_now did not return a signed transaction component.");
        }

        const serializedTxData = Buffer.from(buyIxResponse.data.txSigned.data);
        const buyTransaction = VersionedTransaction.deserialize(serializedTxData);
        const base64Transaction = Buffer.from(buyTransaction.serialize()).toString('base64');

        console.log("Buy transaction prepared.");
        return NextResponse.json({ transaction: base64Transaction });

    } catch (error: any) {
        console.error("Error getting Magic Eden buy_now instructions:", error.response?.status, error.response?.data || error.message, error.config?.params, error);
        const statusCode = error.response?.status || 500;
        let errorMessage = "Unknown error";
        if (axios.isAxiosError(error)) {
             errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
             if(statusCode === 400 && !errorMessage){
                 errorMessage = "Bad Request - Check API parameters.";
             }
        } else if (error instanceof Error) {
             errorMessage = error.message;
        }

        return NextResponse.json(
            { error: `Failed to get Magic Eden buy instructions: ${errorMessage}` },
            { status: statusCode }
        );
    }

  } catch (error: any) {
    console.error("Internal Server Error in /api/buy-nft:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}