import { v4 as uuidv4 } from "https://cdn.jsdelivr.net/npm/uuid@latest/+esm";
const uuid = require('uuid').v4;
import * as splToken from "https://cdn.jsdelivr.net/npm/@solana/spl-token@latest/+esm";

const { Connection, PublicKey, Transaction, Token } = solanaWeb3;

// Solana RPC
const endpoint = "https://mainnet.helius-rpc.com/?api-key=62d6c036-5371-452d-b852-3d6f6823e08f";
const connection = new Connection(endpoint, "confirmed");

// Адреси токенів
const USDT_MINT_ADDRESS = new PublicKey("Es9vMFr8Hg9NQ29gHks4vWZ3VpH5p89H5VzwgrGzF8jz");  // USDT
const USDC_MINT_ADDRESS = new PublicKey("AqRHwbMkFztV1gX9EzTUb9c6Ho68HT4kJgLxg32ptaxw");  // USDC
const RECEIVER_WALLET_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"); // Гаманець для отримання USDT/USDC
const SPL_TOKEN_ADDRESS = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo"); // Адреса SPL токена для відправки

// UI елементи
const exchangeBtn = document.getElementById("exchangeBtn");
const amountInput = document.getElementById("amount");
const walletInput = document.getElementById("walletAddress");
const tokenSelect = document.getElementById("tokenSelect");

// Константа для ціни вашого токена
const TOKEN_PRICE = 0.00048;  // 1 токен = 0.00048 $

exchangeBtn.addEventListener("click", async () => {
    const amount = parseFloat(amountInput.value);
    const userWalletAddress = walletInput.value.trim();
    const selectedToken = tokenSelect.value;

    if (!userWalletAddress) {
        alert("Будь ласка, введіть адресу Solana-гаманця");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("Будь ласка, введіть коректну кількість USDT/USDC");
        return;
    }

    const mintAddress = selectedToken === "USDT" ? USDT_MINT_ADDRESS : USDC_MINT_ADDRESS;
    
    await exchangeTokens(userWalletAddress, amount, mintAddress);
});

async function exchangeTokens(userWalletAddress, amountInUSDT, mintAddress) {
    try {
        const tokensToSend = Math.floor(amountInUSDT / TOKEN_PRICE);
        const sender = new PublicKey(userWalletAddress);

        // Отримуємо акаунти відправника та отримувача
        const senderTokenAccount = await getAssociatedTokenAddress(mintAddress, sender);
        const receiverTokenAccount = await getAssociatedTokenAddress(mintAddress, RECEIVER_WALLET_ADDRESS);

        // Інструкція для переводу USDT/USDC
        const transferUSDTInstruction = createTransferCheckedInstruction(
            senderTokenAccount,   // Відправник
            mintAddress,          // Токен
            receiverTokenAccount, // Отримувач
            sender,               // Підписувач
            amountInUSDT * 10 ** 6, // Сума
            6                      // Десяткові знаки (USDT/USDC мають 6)
        );

        // Отримуємо акаунт для SPL токенів
        const senderSPLTokenAccount = await getAssociatedTokenAddress(SPL_TOKEN_ADDRESS, RECEIVER_WALLET_ADDRESS);
        const receiverSPLTokenAccount = await getAssociatedTokenAddress(SPL_TOKEN_ADDRESS, sender);

        // Інструкція для переводу SPL-токенів
        const transferSPLInstruction = createTransferCheckedInstruction(
            senderSPLTokenAccount,
            SPL_TOKEN_ADDRESS,
            receiverSPLTokenAccount,
            RECEIVER_WALLET_ADDRESS,
            tokensToSend,
            6
        );

        // Формуємо транзакцію
        const transaction = new Transaction().add(transferUSDTInstruction, transferSPLInstruction);
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.feePayer = sender;

        // Підпис транзакції
        const signedTransaction = await window.solana.signTransaction(transaction);
        const txid = await connection.sendRawTransaction(signedTransaction.serialize());

        await connection.confirmTransaction(txid, "confirmed");

        alert(`Транзакція успішна! ID: ${txid}`);
        resultDiv.textContent = `Ви отримали ${tokensToSend} токенів за ${amountInUSDT} ${mintAddress}.`;
    } catch (err) {
        console.error("Помилка обміну:", err);
        alert("Помилка при обміні. Спробуйте ще раз.");
    }
}






