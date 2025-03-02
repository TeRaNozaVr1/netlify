const { Connection, PublicKey, SystemProgram, Transaction, Token } = solanaWeb3;

// Solana RPC
const endpoint = "https://mainnet.helius-rpc.com/?api-key=62d6c036-5371-452d-b852-3d6f6823e08f";
const connection = new Connection(endpoint, "confirmed");

// Адреси токенів
const USDT_MINT_ADDRESS = new PublicKey("Es9vMFr8Hg9NQ29gHks4vWZ3VpH5p89H5VzwgrGzF8jz");  // Коректна адреса USDT
const USDC_MINT_ADDRESS = new PublicKey("AqRHwbMkFztV1gX9EzTUb9c6Ho68HT4kJgLxg32ptaxw");  // Коректна адреса USDC
const RECEIVER_WALLET_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"); // Гаманець для отримання USDT/USDC
const SPL_TOKEN_ADDRESS = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo"); // Адреса SPL токена для відправки

// UI елементи
const exchangeBtn = document.getElementById("exchangeBtn");
const resultDiv = document.getElementById("result");
const amountInput = document.getElementById("amount");
const walletInput = document.getElementById("walletAddress");
const tokenSelect = document.getElementById("tokenSelect");

// Перевірка балансу перед обміном
async function getTokenBalance(ownerAddress, mintAddress) {
    try {
        const mintPubKey = new PublicKey(mintAddress);
        const ownerPubKey = new PublicKey(ownerAddress);
        const response = await connection.getParsedTokenAccountsByOwner(ownerPubKey, { mint: mintPubKey });

        if (!response.value || response.value.length === 0) {
            console.log("Користувач не має акаунта для цього токена.");
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
        alert(`Недостатньо коштів для обміну ${selectedToken}!`);
        return;
    }

    await exchangeTokens(userWalletAddress, amount, mintAddress);
});

// Функція для обміну USDT/USDC на SPL токени
async function exchangeTokens(userWalletAddress, amountInUSDT, mintAddress) {
    try {
        const transaction = new Transaction();
        const sender = new PublicKey(userWalletAddress);

        // Створення інструкції для переведення USDT/USDC на гаманець 4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU
        const transferInstruction = SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: RECEIVER_WALLET_ADDRESS,
            lamports: amountInUSDT * 1000000000 // Конвертація
        });

        transaction.add(transferInstruction);

        // Створення інструкції для відправки SPL токенів
        const token = new Token(connection, SPL_TOKEN_ADDRESS, solanaWeb3.TOKEN_PROGRAM_ID, sender); // Ініціалізація токена
        const senderTokenAccount = await token.getOrCreateAssociatedAccountInfo(sender); // Отримання токен-аккаунту користувача

        const transferTokenInstruction = Token.createTransferInstruction(
            solanaWeb3.TOKEN_PROGRAM_ID,
            senderTokenAccount.address, // Адреса токен-аккаунту користувача
            RECEIVER_WALLET_ADDRESS, // Адреса отримувача
            sender, // Підписант
            [],
            amountInUSDT * 1000000 // Конвертація до одиниць токенів (за потреби змінити кількість)
        );

        transaction.add(transferTokenInstruction);

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sender;

        alert("Зараз згенерується транзакція, підпишіть її у своєму гаманці");
        console.log("Згенерована транзакція:", transaction);

        resultDiv.style.display = "block";
        resultDiv.textContent = "Транзакція створена! Підпишіть її у своєму гаманці.";
    } catch (err) {
        console.error("Помилка обміну:", err);
        resultDiv.style.display = "block";
        resultDiv.textContent = "Помилка при обміні. Спробуйте ще раз.";
    }
}
