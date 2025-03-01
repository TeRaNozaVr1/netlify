document.addEventListener("DOMContentLoaded", async function () {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");

    async function connectWallet(autoConnect = false) {
        if (window.solana && window.solana.isPhantom) {
            try {
                // Автопідключення, якщо користувач уже підтвердив гаманець
                const response = await window.solana.connect({ onlyIfTrusted: autoConnect });

                // Зберігаємо підключений гаманець у localStorage
                localStorage.setItem("phantomWallet", response.publicKey.toString());

                // Відображаємо підключений гаманець
                walletStatus.textContent = `Connected: ${response.publicKey.toString()}`;
                connectWalletBtn.textContent = "Wallet Connected";
                connectWalletBtn.disabled = true;

                // Отримуємо баланс
                const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("mainnet-beta"));
                const balance = await connection.getBalance(response.publicKey);
                console.log(`Balance: ${balance / solanaWeb3.LAMPORTS_PER_SOL} SOL`);

                // Отримуємо історію транзакцій
                const transactions = await connection.getConfirmedSignaturesForAddress2(response.publicKey);
                console.log("Recent transactions:", transactions);

            } catch (err) {
                console.error("Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
                localStorage.removeItem("phantomWallet"); // Видаляємо збережений гаманець, якщо є помилка
            }
        } else {
            // Перевіряємо, чи це мобільний пристрій
            if (/Android|iPhone/i.test(navigator.userAgent)) {
                const deeplink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent("https://cool-kataifi-90a5d5.netlify.app")}&redirect_link=${encodeURIComponent(window.location.href)}`;
                window.location.href = deeplink;
            } else {
                alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
                window.open("https://phantom.app/", "_blank");
            }
        }
    }

    // Автоматична перевірка підключеного гаманця
    async function checkAutoConnect() {
        const savedWallet = localStorage.getItem("phantomWallet");
        if (savedWallet) {
            await connectWallet(true);
        }
    }

    connectWalletBtn.addEventListener("click", () => connectWallet(false));

    // Виконуємо автоматичне підключення при завантаженні сторінки
    checkAutoConnect();
});






