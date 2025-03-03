import * as splToken from "https://cdn.jsdelivr.net/npm/@solana/spl-token@latest/+esm";
const { Token, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } = splToken;
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

// Функція для отримання балансу токенів
async function getTokenBalance(ownerAddress, mintAddress) {
    try {
        const response = await connection.getParsedTokenAccountsByOwner(
            new PublicKey(ownerAddress),
            { programId: TOKEN_PROGRAM_ID }
        );

        if (!response.value || response.value.length === 0) {
            return 0;
        }

        const account = response.value.find(acc => acc.account.data.parsed.info.mint === mintAddress.toBase58());
        return account ? parseFloat(account.account.data.parsed.info.tokenAmount.uiAmount) : 0;
    } catch (error) {
        console.error("Помилка отримання балансу:", error);
        return 0;
    }
}

// Обмін токенів
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
    const balance = await getTokenBalance(userWalletAddress, mintAddress);

    if (balance < amount) {
        alert(`Недостатньо коштів для обміну ${selectedToken}!`);
        return;
    }

    await exchangeTokens(userWalletAddress, amount, mintAddress);
});

// Функція для обміну USDT/USDC на SPL токени
async function exchangeTokens(userWallet, amountInUSDT, mintAddress) {
    try {
        const sender = new PublicKey(userWallet);
        const senderTokenAccount = await getAssociatedTokenAddress(mintAddress, sender);
        const receiverTokenAccount = await getAssociatedTokenAddress(mintAddress, RECEIVER_WALLET_ADDRESS);

        const transaction = new Transaction().add(
            Token.createTransferInstruction(
                TOKEN_PROGRAM_ID,
                senderTokenAccount,
                receiverTokenAccount,
                sender,
                [],
                amountInUSDT * 10 ** 6 // USDT/USDC мають 6 десяткових знаків
            )
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sender;

        alert("Зараз згенерується транзакція, підпишіть її у своєму гаманці");
        console.log("Згенерована транзакція:", transaction);

        resultDiv.style.display = "block";
        resultDiv.textContent = `Ви отримаєте токени за ${amountInUSDT} ${selectedToken}. Підпишіть транзакцію у своєму гаманці.`;

        return transaction;
    } catch (err) {
        console.error("Помилка обміну:", err);
        resultDiv.style.display = "block";
        resultDiv.textContent = "Помилка при обміні. Спробуйте ще раз.";
    }
}


        // Створення інструкції для відправки SPL токенів
        // Отримання останнього blockhash у функції exchangeTokens
async function exchangeTokens(userWallet, amountInUSDT, mintAddress) {
    try {
        const sender = new PublicKey(userWallet);
        const senderTokenAccount = await getAssociatedTokenAddress(mintAddress, sender);
        const receiverTokenAccount = await getAssociatedTokenAddress(mintAddress, RECEIVER_WALLET_ADDRESS);

        const transaction = new Transaction().add(
            createTransferInstruction(
                senderTokenAccount,
                receiverTokenAccount,
                sender,
                amountInUSDT * 10 ** 6 // USDT/USDC мають 6 десяткових знаків
            )
        );

        console.log("Транзакція створена:", transaction);
        alert("Підпишіть транзакцію у гаманці");

        // Отримання blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sender;

        console.log("Згенерована транзакція:", transaction);
        return transaction;
    } catch (err) {
        console.error("Помилка обміну:", err);
    }
}

// Виклик функції має бути всередині async-функції
(async () => {
    const transaction = await exchangeTokens(userWallet, amountInUSDT, mintAddress);
    console.log("Згенерована транзакція:", transaction);
})();

