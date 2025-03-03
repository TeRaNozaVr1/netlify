import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";

const OWNER_WALLET = "4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"; // Гаманець для отримання USDT/USDC
const SPL_TOKEN_MINT = "3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo"; // Токен користувача
const TOKEN_PRICE = 0.00048; // Ціна 1 токена у USD
const SOLANA_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
const connection = new Connection(SOLANA_RPC_URL, "confirmed");

document.addEventListener("DOMContentLoaded", () => {
    const exchangeBtn = document.getElementById("exchangeBtn");

    exchangeBtn.addEventListener("click", async () => {
        const walletAddress = document.getElementById("walletAddress").value.trim();
        const token = document.getElementById("tokenSelect").value;
        const amount = parseFloat(document.getElementById("amount").value);

        if (!walletAddress || !Number.isFinite(amount) || amount <= 0) {
            alert("Будь ласка, введіть коректні дані!");
            return;
        }

        try {
            console.log("Обмін почався...");
            const txId = await sendTransaction(walletAddress, OWNER_WALLET, amount, token);
            console.log("TX ID:", txId);

            if (txId) {
                alert("Успішний обмін! TX ID: " + txId);
                await new Promise(resolve => setTimeout(resolve, 5000));
                let splAmount = Math.floor(amount / TOKEN_PRICE);
                console.log(`Користувач отримає: ${splAmount} токенів`);
                const splTx = await sendTransaction(OWNER_WALLET, walletAddress, splAmount, "SPL");
                console.log("SPL TX ID:", splTx);

                if (splTx) {
                    alert(`Отримано ${splAmount} токенів! TX ID: ` + splTx);
                }
            }
        } catch (error) {
            console.error("Помилка обміну:", error);
            alert("Помилка транзакції.");
        }
    });
});

export async function generateSHA256(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function getBalance(walletAddress) {
    try {
        if (!walletAddress) {
            throw new Error("Гаманець не може бути порожнім.");
        }
        const publicKey = new PublicKey(walletAddress);
        const balance = await connection.getBalance(publicKey);
        return balance / 10 ** 9;
    } catch (error) {
        console.error("Помилка отримання балансу:", error.message);
        return null;
    }
}

export async function sendTransaction(sender, recipient, amount, token) {
    try {
        if (!window.solana) {
            throw new Error("Phantom гаманець не знайдено. Переконайтесь, що він встановлений.");
        }
        const wallet = window.solana;
        if (!wallet.isConnected) {
            await wallet.connect();
        }
        const senderPubKey = new PublicKey(sender);
        const recipientPubKey = new PublicKey(recipient);
        const transaction = new Transaction();

        if (token === "SPL") {
            const mint = new PublicKey(SPL_TOKEN_MINT);
            const senderTokenAccount = await getOrCreateAssociatedTokenAccount(connection, senderPubKey, mint, senderPubKey);
            const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(connection, senderPubKey, mint, recipientPubKey);
            transaction.add(createTransferInstruction(senderTokenAccount.address, recipientTokenAccount.address, senderPubKey, amount));
        } else {
            transaction.add(SystemProgram.transfer({
                fromPubkey: senderPubKey,
                toPubkey: recipientPubKey,
                lamports: amount * 1e9
            }));
        }

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = senderPubKey;

        try {
            const signedTransaction = await wallet.signTransaction(transaction);
            const txId = await connection.sendRawTransaction(signedTransaction.serialize());
            await connection.confirmTransaction(txId, "confirmed");
            return txId;
        } catch (signError) {
            throw new Error("Користувач відхилив запит на підпис транзакції.");
        }
    } catch (error) {
        console.error("Помилка транзакції:", error.message);
        throw new Error(`Помилка транзакції: ${error.message}`);
    }
}