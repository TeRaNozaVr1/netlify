const { Connection, PublicKey, SystemProgram, Transaction } = solanaWeb3;

// Solana RPC
const endpoint = "https://mainnet.helius-rpc.com/?api-key=62d6c036-5371-452d-b852-3d6f6823e08f";
const connection = new Connection(endpoint, "confirmed");

// Адреса гаманців
const USDT_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
const USDC_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
const SPL_TOKEN_ADDRESS = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo");

// UI Елементи
const exchangeBtn = document.getElementById("exchangeBtn");
const resultDiv = document.getElementById("result");
const amountInput = document.getElementById("amount");
const walletInput = document.getElementById("walletAddress");

// Перевірка балансу перед обміном
async function getTokenBalance(ownerAddress, mintAddress) {
    try {
        const ownerPubKey = new PublicKey(ownerAddress);
        const mintPubKey = new PublicKey(mintAddress);

        const response = await connection.getParsedTokenAccountsByOwner(ownerPubKey, {
            programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        });

        if (!response.value || response.value.length === 0) {
            console.log("Користувач не має токен-акаунтів.");
            return 0;
        }

        // Знайти потрібний токен-акаунт
        const tokenAccount = response.value.find(
            (acc) => acc.account.data.parsed.info.mint === mintPubKey.toBase58()
        );

        if (!tokenAccount) {
            console.log("Токен-акаунт не знайдено.");
            return 0;
        }

        return parseFloat(tokenAccount.account.data.parsed.info.tokenAmount.uiAmount);
    } catch (error) {
        console.error("Помилка отримання балансу:", error);
        return 0;
    }
}


// Обмін токенів
exchangeBtn.addEventListener("click", async () => {
    const amount = parseFloat(amountInput.value);
    const userWalletAddress = walletInput.value.trim();
    
    if (!userWalletAddress) {
        alert("Будь ласка, введіть адресу Solana-гаманця");
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        alert("Будь ласка, введіть коректну кількість USDT/USDC");
        return;
    }
    
    const balanceUSDT = await getTokenBalance(userWalletAddress, USDT_MINT_ADDRESS);
    const balanceUSDC = await getTokenBalance(userWalletAddress, USDC_MINT_ADDRESS);

    if (balanceUSDT < amount && balanceUSDC < amount) {
        alert("Недостатньо коштів для обміну!");
        return;
    }

    await exchangeTokens(userWalletAddress, amount);
});

// Функція для обміну USDT/USDC
async function exchangeTokens(userWalletAddress, amountInUSDT) {
    try {
        const transaction = new Transaction();
        const sender = new PublicKey(userWalletAddress);
        
        const hasUSDT = await getTokenBalance(sender, USDT_MINT_ADDRESS) >= amountInUSDT;
        const mintAddress = hasUSDT ? USDT_MINT_ADDRESS : USDC_MINT_ADDRESS;

        const transferInstruction = SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: SPL_TOKEN_ADDRESS,
            lamports: amountInUSDT * 1000000000 // Конвертація
        });

        transaction.add(transferInstruction);

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sender;

        // Транзакцію має підписати користувач вручну
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
