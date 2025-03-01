document.addEventListener("DOMContentLoaded", async function () {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");

    async function connectWallet(autoConnect = false) {
        if (window.solana && window.solana.isPhantom) {
            try {
                // Викликаємо підключення
                const response = await window.solana.connect({ onlyIfTrusted: autoConnect });

                // Зберігаємо адресу гаманця в localStorage
                localStorage.setItem("phantomWallet", response.publicKey.toString());

                // Оновлюємо UI
                walletStatus.textContent = `Connected: ${response.publicKey.toString()}`;
                connectWalletBtn.textContent = "Wallet Connected";
                connectWalletBtn.disabled = true;

                console.log("Wallet connected:", response.publicKey.toString());
            } catch (err) {
                console.error("Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
                localStorage.removeItem("phantomWallet"); // Очищуємо дані у разі помилки
            }
        } else {
            console.log("Phantom not found. Redirecting to install...");
            // Якщо користувач на мобільному, відкриваємо додаток через deeplink
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
