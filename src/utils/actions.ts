"use server"

import { Connection } from "@solana/web3.js";

export const confirmTransaction = async (signature: string, blockhash: string, lastValidBlockHeight: number)=>{
    try{
        const solConnection = new Connection(process.env.SOLANA_RPC_URL!);
        console.log("Confirming transaction with signature:", signature);
        await solConnection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight,
        });
        return true;

    } catch (e) {
        console.error("Error confirming transaction:", e);
        return false;
    }
}