import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";

const OWNER_WALLET = "4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU";
const SPL_TOKEN_MINT = "3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo";
const TOKEN_PRICE = 0.00048;
const SOLANA_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
const connection = new Connection(SOLANA_RPC_URL, "confirmed");

let selectedWallet = null;

// Функція підключення до гаманця
async function connectWallet() {
    if (window.solana && window.solana.isPhantom) {
        selectedWallet = "Phantom";
    } else if (window.solflare) {
        selectedWallet = "Solflare";
    } else {
        alert("Гаманець Solana не знайдено. Встановіть Phantom або Solflare.");
        return;
    }

    try {
        await window.solana.connect();
        const publicKey = window.solana.publicKey.toBase58();
        document.getElementById("walletStatus").innerText = `Підключено: ${publicKey} (${selectedWallet})`;
        console.log(`✅ Підключено до ${selectedWallet}:`, publicKey);
    } catch (error) {
        console.error("Помилка підключення:", error);
        alert("Не вдалося підключитися до гаманця.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
    document.getElementById("exchangeBtn").addEventListener("click", async () => {
        if (!window.solana || !window.solana.isConnected) {
            alert("Будь ласка, спочатку підключіть гаманець!");
            return;
        }

        const walletAddress = window.solana.publicKey.toBase58();
        const token = document.getElementById("tokenSelect").value;
        const amount = parseFloat(document.getElementById("amount").value);

        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Будь ласка, введіть коректну суму!");
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

async function sendTransaction(sender, recipient, amount, token) {
    try {
        const wallet = window.solana;
        if (!wallet || !wallet.isConnected) {
            throw new Error("Гаманець не підключений.");
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

        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        try {
            const signedTx = await wallet.signAndSendTransaction(transaction);
            console.log("✅ Transaction ID:", signedTx.signature);
            return signedTx.signature;
        } catch (signError) {
            throw new Error("Користувач відхилив запит на підпис транзакції.");
        }
    } catch (error) {
        console.error("Помилка транзакції:", error.message);
        throw new Error(`Помилка транзакції: ${error.message}`);
    }
}
