const { Connection, PublicKey, Transaction, SystemProgram, Token } = solanaWeb3;

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
const resultDiv = document.getElementById("result");
const amountInput = document.getElementById("amount");
const walletInput = document.getElementById("walletAddress");
const tokenSelect = document.getElementById("tokenSelect");

// Константа для ціни вашого токена
const TOKEN_PRICE = 0.00048;  // 1 токен = 0.00048 $

async function getTokenBalance(ownerAddress, mintAddress) {
    try {
        const mintPubKey = new PublicKey(mintAddress);
        const ownerPubKey = new PublicKey(ownerAddress);
        const response = await connection.getParsedTokenAccountsByOwner(ownerPubKey, { mint: mintPubKey });

        if (!response.value || response.value.length === 0) {
            console.log("Користувач не має акаунта для цього токена. Створюємо акаунт...");
            // Створення акаунта для токена
            const token = new Token(connection, mintPubKey, solanaWeb3.TOKEN_PROGRAM_ID, ownerPubKey);
            const associatedTokenAccount = await token.getOrCreateAssociatedAccountInfo(ownerPubKey);
            console.log("Створено токен-акаунт:", associatedTokenAccount);
            return 0;
        }

        return parseFloat(response.value[0].account.data.parsed.info.tokenAmount.uiAmount);
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

    // Вибір токена для обміну
    const mintAddress = selectedToken === "USDT" ? USDT_MINT_ADDRESS : USDC_MINT_ADDRESS;
    const balance = await getTokenBalance(userWalletAddress, mintAddress);

    if (balance < amount) {
        alert(Недостатньо коштів для обміну ${selectedToken}!);
        return;
    }

    await exchangeTokens(userWalletAddress, amount, mintAddress);
});

async function exchangeTokens(userWalletAddress, amountInUSDT, mintAddress) {
    try {
        const tokensToSend = Math.floor(amountInUSDT / TOKEN_PRICE);
        const transaction = new Transaction();
        const sender = new PublicKey(userWalletAddress);

        // Отримуємо акаунт користувача для вибраного токена
        const senderTokenAccount = (await connection.getParsedTokenAccountsByOwner(sender, { mint: mintAddress })).value[0]?.pubkey;
        if (!senderTokenAccount) {
            alert("У вас немає акаунту для цього токена!");
            return;
        }

        // Отримуємо акаунт отримувача (гаманця RECEIVER_WALLET_ADDRESS) для USDT/USDC
        const receiverTokenAccount = (await connection.getParsedTokenAccountsByOwner(RECEIVER_WALLET_ADDRESS, { mint: mintAddress })).value[0]?.pubkey;
        if (!receiverTokenAccount) {
            alert("Помилка: у отримувача немає акаунту для USDT/USDC!");
            return;
        }

        // Інструкція для переводу USDT/USDC від користувача до отримувача
        const transferUSDTInstruction = Token.createTransferInstruction(
            solanaWeb3.TOKEN_PROGRAM_ID,
            senderTokenAccount,
            receiverTokenAccount,
            sender,
            [],
            amountInUSDT * 10 ** 6 // USDT/USDC мають 6 знаків після коми
        );

        transaction.add(transferUSDTInstruction);

        // Отримуємо акаунт користувача для SPL-токенів
        const senderSPLTokenAccount = (await connection.getParsedTokenAccountsByOwner(sender, { mint: SPL_TOKEN_ADDRESS })).value[0]?.pubkey;
        if (!senderSPLTokenAccount) {
            alert("У вас немає акаунту для SPL токена!");
            return;
        }

        // Отримуємо акаунт отримувача SPL-токенів
        const receiverSPLTokenAccount = (await connection.getParsedTokenAccountsByOwner(sender, { mint: SPL_TOKEN_ADDRESS })).value[0]?.pubkey;
        if (!receiverSPLTokenAccount) {
            alert("Помилка: у отримувача немає акаунту для SPL токенів!");
            return;
        }

        // Інструкція для переводу SPL токенів
        const transferSPLInstruction = Token.createTransferInstruction(
            solanaWeb3.TOKEN_PROGRAM_ID,
            senderSPLTokenAccount,
            receiverSPLTokenAccount,
            RECEIVER_WALLET_ADDRESS,
            [],
            tokensToSend
        );

        transaction.add(transferSPLInstruction);

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sender;

        // Підпис транзакції
        const signedTransaction = await window.solana.signTransaction(transaction);

        // Відправка транзакції
        const txid = await connection.sendRawTransaction(signedTransaction.serialize());

        // Очікування підтвердження транзакції
        const confirmation = await connection.confirmTransaction(txid, "confirmed");

        if (confirmation.value.err) {
            throw new Error("Транзакція не підтверджена!");
        }

        alert(`Транзакція успішна! ID: ${txid}`);
        resultDiv.style.display = "block";
        resultDiv.textContent = `Ви отримали ${tokensToSend} токенів за ${amountInUSDT} ${selectedToken}. Транзакція підтверджена!`;
    } catch (err) {
        console.error("Помилка обміну:", err);
        resultDiv.style.display = "block";
        resultDiv.textContent = "Помилка при обміні. Спробуйте ще раз.";
    }
}





