// Завантажуємо Solana Web3.js через CDN
if (typeof solanaWeb3 === "undefined") {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/solana-web3.js/1.75.0/solanaWeb3.min.js";
    script.onload = () => initWallet();
    document.head.appendChild(script);
} else {
    initWallet();
}

function initWallet() {
    const { Connection, PublicKey, clusterApiUrl, SystemProgram, Transaction } = solanaWeb3;

    // Solana RPC
    const endpoint = clusterApiUrl("mainnet-beta");
    const connection = new Connection(endpoint, "confirmed");

    // Адреси токенів
    const USDT_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
    const USDC_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");

    // Функція перевірки мобільного пристрою
    const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Функція отримання гаманця
    const getWallet = (walletType) => {
        if (walletType === "phantom" && window.phantom?.solana?.isPhantom) {
            return window.phantom.solana;
        } else if (walletType === "solflare" && window.solflare?.isSolflare) {
            return window.solflare;
        }
        return null;
    };

    // Підключення через диплінк
    const connectViaDeepLink = (walletType) => {
        const deepLink = isMobile()
            ? walletType === "phantom"
                ? "phantom://v1/connect?app_url=https://yourapp.com"
                : "solflare://connect"
            : walletType === "phantom"
                ? "https://phantom.app/ul/v1/connect?app_url=https://yourapp.com"
                : "https://solflare.com/connect";

        window.location.href = deepLink;
    };

    // Функція підключення гаманця
    const connectWallet = async (walletType) => {
        const wallet = getWallet(walletType);
        if (!wallet) {
            connectViaDeepLink(walletType);
            return;
        }

        try {
            await wallet.connect();
            console.log("Гаманець підключено:", wallet.publicKey.toString());
            document.dispatchEvent(new CustomEvent("walletConnected", { detail: wallet.publicKey.toString() }));
        } catch (err) {
            console.error("Помилка підключення:", err);
        }
    };

    // Отримання балансу
    const getTokenBalance = async (ownerAddress, mintAddress) => {
        try {
            const response = await connection.getParsedTokenAccountsByOwner(ownerAddress, { mint: mintAddress });
            return response.value.length > 0 ? parseFloat(response.value[0].account.data.parsed.info.tokenAmount.uiAmount) : 0;
        } catch (error) {
            console.error("Помилка отримання балансу:", error);
            return 0;
        }
    };

    // Запит дозволу на обробку балансу
    const requestBalancePermission = async (walletType) => {
        const wallet = getWallet(walletType);
        if (!wallet || !wallet.publicKey) {
            alert("Будь ласка, підключіть гаманець.");
            return;
        }

        const balanceUSDT = await getTokenBalance(wallet.publicKey, USDT_MINT_ADDRESS);
        const balanceUSDC = await getTokenBalance(wallet.publicKey, USDC_MINT_ADDRESS);

        console.log(`Баланс USDT: ${balanceUSDT}, Баланс USDC: ${balanceUSDC}`);
        document.dispatchEvent(new CustomEvent("balanceFetched", { detail: { USDT: balanceUSDT, USDC: balanceUSDC } }));
    };

    // Отримання історії транзакцій
    const getTransactionHistory = async (publicKey) => {
        try {
            const signatures = await connection.getConfirmedSignaturesForAddress2(publicKey);
            const transactions = await Promise.all(signatures.map(sig => connection.getTransaction(sig.signature)));
            console.log("Історія транзакцій:", transactions);
            document.dispatchEvent(new CustomEvent("transactionHistoryFetched", { detail: transactions }));
        } catch (error) {
            console.error("Помилка отримання історії:", error);
        }
    };

    // Запуск функцій після завантаження скрипта
    window.walletUtils = {
        connectWallet,
        requestBalancePermission,
        getTransactionHistory
    };
}
