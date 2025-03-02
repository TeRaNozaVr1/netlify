const { Connection, PublicKey, SystemProgram, Transaction } = solanaWeb3;

// Solana RPC
const endpoint = "https://mainnet.helius-rpc.com/?api-key=62d6c036-5371-452d-b852-3d6f6823e08f";
const connection = new Connection(endpoint, "confirmed");

// Адреси токенів
const USDT_MINT_ADDRESS = new PublicKey("Es9vMFr8Hg9NQ29gHks4vWZ3VpH5p89H5VzwgrGzF8jz");  // Заміна на правильну адресу USDT
const USDC_MINT_ADDRESS = new PublicKey("AqRHwbMkFztV1gX9EzTUb9c6Ho68HT4kJgLxg32ptaxw");  // Заміна на правильну адресу USDC
const RECEIVER_WALLET_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"); // Гаманець для отримання

// UI Елементи
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

// Функція для обміну USDT/USDC
async function exchangeTokens(userWalletAddress, amountInUSDT, mintAddress) {
    try {
        const transaction = new Transaction();
        const sender = new PublicKey(userWalletAddress);

        // Створення інструкції для переведення токенів
        const transferInstruction = SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: RECEIVER_WALLET_ADDRESS, // Використовуємо нову адресу отримувача
            lamports: amountInUSDT * 1000000000 // Конвертація
        });

        transaction.add(transferInstruction);

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
