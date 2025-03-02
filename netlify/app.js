document.addEventListener("DOMContentLoaded", async function () { 
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");

    async function connectWallet(autoConnect = false) {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect({ onlyIfTrusted: autoConnect });

                // Зберігаємо адресу гаманця
                localStorage.setItem("phantomWallet", response.publicKey.toString());

                // Оновлюємо UI
                walletStatus.textContent = `Connected: ${response.publicKey.toString()}`;
                connectWalletBtn.textContent = "Wallet Connected";
                connectWalletBtn.disabled = true;

                console.log("✅ Wallet connected:", response.publicKey.toString());
            } catch (err) {
                console.error("❌ Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
                localStorage.removeItem("phantomWallet"); // Очищуємо у разі помилки
            }
        } else {
            console.log("⚠️ Phantom не знайдено. Відкриваємо додаток...");

            if (/Android|iPhone/i.test(navigator.userAgent)) {
                const deeplink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent(window.location.origin)}&redirect_link=${encodeURIComponent(window.location.href)}`;
                window.location.href = deeplink;
            } else {
                alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
                window.open("https://phantom.app/", "_blank");
            }
        }
    }

    // Функція перевірки LocalStorage після редиректу
    function checkWalletAfterRedirect() {
        const savedWallet = localStorage.getItem("phantomWallet");
        if (savedWallet) {
            walletStatus.textContent = `Connected: ${savedWallet}`;
            connectWalletBtn.textContent = "Wallet Connected";
            connectWalletBtn.disabled = true;
            console.log("✅ Wallet restored from LocalStorage:", savedWallet);
        }
    }

    connectWalletBtn.addEventListener("click", () => connectWallet(false));

    // Виконуємо перевірку після перезавантаження або редиректу
    checkWalletAfterRedirect();
});
