const { Connection, PublicKey, clusterApiUrl } = require("@solana/web3.js");

exports.handler = async function (event, context) {
    try {
        // 🟢 Замініть на реальний SOL-адрес гаманця
        const WALLET_ADDRESS = "3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo";

        // Підключення до mainnet Solana
        const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
        const publicKey = new PublicKey(WALLET_ADDRESS);

        // Отримання балансу гаманця в лампортах (1 SOL = 1_000_000_000 лампортів)
        const balanceLamports = await connection.getBalance(publicKey);
        const balanceSOL = balanceLamports / 1_000_000_000;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: "connected",
                wallet: WALLET_ADDRESS,
                balance: balanceSOL,
                currency: "SOL"
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Internal Server Error", details: error.message })
        };
    }
};
