import {
    getAssociatedTokenAddress,
    createTransferInstruction,
    TOKEN_PROGRAM_ID
} from "https://cdn.jsdelivr.net/npm/@solana/spl-token@latest/+esm";

const { Connection, PublicKey, Transaction, SystemProgram } = solanaWeb3;

// Solana RPC
const endpoint = "https://mainnet.helius-rpc.com/?api-key=62d6c036-5371-452d-b852-3d6f6823e08f";
const connection = new Connection(endpoint, "confirmed");

// Адреси токенів
const USDT_MINT_ADDRESS = new PublicKey("Es9vMFr8Hg9NQ29gHks4vWZ3VpH5p89H5VzwgrGzF8jz");  // USDT
const USDC_MINT_ADDRESS = new PublicKey("AqRHwbMkFztV1gX9EzTUb9c6Ho68HT4kJgLxg32ptaxw");  // USDC
const RECEIVER_WALLET_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"); // Гаманець для отримання USDT/USDC
const SPL_TOKEN_ADDRESS = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo"); // Адреса SPL токена

// UI елементи
const exchangeBtn = document.getElementById("exchangeBtn");
const resultDiv = document.getElementById("result");
const amountInput = document.getElementById("amount");
const walletInput = document.getElementById("walletAddress");
const tokenSelect = document.getElementById("tokenSelect");

// Константа для ціни токена
const TOKEN_PRICE = 0.00048;  // 1 токен = 0.00048 $

async function getAssociatedTokenAddress(mint, owner) {
    return await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        owner
    );
}

// Функція для отримання балансу токенів користувача
async function getTokenBalance(walletAddress, mintAddress) {
    try {
        const userPublicKey = new PublicKey(walletAddress);
        const tokenAccount = await getAssociatedTokenAddress(mintAddress, userPublicKey);
        const balance = await connection.getTokenAccountBalance(tokenAccount);
        return balance.value.uiAmount || 0;
    } catch (err) {
        console.error("Помилка отримання балансу:", err);
        return 0;
    }
}

// Функція для обміну токенів
async function exchangeTokens(userWallet, amount, mintAddress) {
    try {
        const sender = new PublicKey(userWallet);
        const senderTokenAccount = await getAssociatedTokenAddress(mintAddress, sender);
        const receiverTokenAccount = await getAssociatedTokenAddress(mintAddress, RECEIVER_WALLET_ADDRESS);

        const transaction = new Transaction().add(
            createTransferInstruction(
                senderTokenAccount,
                receiverTokenAccount,
                sender,
                amount * 10 ** 6 // USDT/USDC мають 6 десяткових знаків
            )
        );

// Додаємо слухач події на кнопку обміну
const exchangeBtn = document.getElementById("exchangeBtn");
exchangeBtn.addEventListener("click", async () => {
    const amount = parseFloat(document.getElementById("amountInput").value);
    const userWalletAddress = document.getElementById("walletInput").value.trim();
    const selectedToken = document.getElementById("tokenSelect").value;

    if (!userWalletAddress) {
        alert("Будь ласка, введіть адресу Solana-гаманця");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("Будь ласка, введіть коректну кількість USDT/USDC");
        return;
    }

    const mintAddress = selectedToken === "USDT" ? USDT_MINT_ADDRESS : USDC_MINT_ADDRESS;
    const balance = await getTokenBalance(userWalletAddress, mintAddress);

    if (balance < amount) {
        alert(`Недостатньо коштів для обміну ${selectedToken}!`);
        return;
    }

    const signature = await exchangeTokens(userWalletAddress, amount, mintAddress);
    if (signature) {
        document.getElementById("resultDiv").textContent = `Транзакція успішна! Хеш: ${signature}`;
    }
});



