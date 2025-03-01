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
const signMessageBtn = document.getElementById("signMessageBtn");
const sendTransactionBtn = document.getElementById("sendTransactionBtn");

// Функция для определения мобильного устройства
function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Підключення гаманця через диплінк
function connectWallet(walletType) {
    closePopup();

    if (isMobile()) {
        const dappUrl = encodeURIComponent(window.location.origin); // URL сайту для повернення
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
        alert("Будь ласка, встановіть " + (walletType === "phantom" ? "Phantom Wallet" : "Solflare"));
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

// Підпис повідомлення через диплінк
function signMessage() {
    const message = "Підтвердіть свій гаманець";
    const encodedMessage = btoa(message);
    if (isMobile()) {
        window.location.href = `phantom://signMessage?message=${encodedMessage}&redirect_link=${encodeURIComponent(window.location.href)}`;
    } else {
        alert("Функція доступна тільки на мобільних пристроях");
    }
}

// Відправка транзакції через диплінк
function sendTransaction() {
    if (!walletStatus.textContent.includes("Гаманець підключено")) {
        alert("Спочатку підключіть гаманець!");
        return;
    }
    
    const recipient = SPL_TOKEN_ADDRESS.toString();
    const amount = 0.01 * 1000000000; // 0.01 SOL у лампортах
    
    if (isMobile()) {
        window.location.href = `phantom://signTransaction?recipient=${recipient}&amount=${amount}&redirect_link=${encodeURIComponent(window.location.href)}`;
    } else {
        alert("Функція доступна тільки на мобільних пристроях");
    }
}

// Прив'язка подій до кнопок
connectWalletBtn.addEventListener("click", connectWallet);
signMessageBtn.addEventListener("click", signMessage);
sendTransactionBtn.addEventListener("click", sendTransaction);
