document.addEventListener("DOMContentLoaded", async function () {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");

    async function connectWallet(autoConnect = false) {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect({ onlyIfTrusted: autoConnect });

                if (response.publicKey) {
                    const walletAddress = response.publicKey.toString();

                    // ✅ Зберігаємо адресу у localStorage
                    localStorage.setItem("phantomWallet", walletAddress);

                    // ✅ Оновлюємо UI
                    walletStatus.textContent = `Connected: ${walletAddress}`;
                    connectWalletBtn.textContent = "Wallet Connected";
                    connectWalletBtn.disabled = true;

                    console.log("✅ Wallet connected:", walletAddress);
                } else {
                    console.error("⚠️ Не отримано publicKey після підключення.");
                }
            } catch (err) {
                console.error("❌ Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
                localStorage.removeItem("phantomWallet"); // Очищуємо дані у разі помилки
            }
        } else {
            console.log("⚠️ Phantom не знайдено. Використовуємо deeplink...");

            if (/Android|iPhone/i.test(navigator.userAgent)) {
                // 📲 **Оновлений deeplink для відкриття у додатку Phantom**
                const deeplink = `phantom://ul/v1/connect?app_url=${encodeURIComponent("https://cool-kataifi-90a5d5.netlify.app")}&redirect_link=${encodeURIComponent(window.location.href)}`;
                window.location.href = deeplink;

                // ⏳ Чекаємо 2 секунди, якщо не відкрився додаток → відкриваємо браузерну версію
                setTimeout(() => {
                    window.location.href = "https://phantom.app/";
                }, 2000);
            } else {
                alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
                window.open("https://phantom.app/", "_blank");
            }
        }
    }

    // ✅ Перевіряємо збережений гаманець після редіректу
    async function checkWalletAfterRedirect() {
        const savedWallet = localStorage.getItem("phantomWallet");
        if (savedWallet) {
            walletStatus.textContent = `Connected: ${savedWallet}`;
            connectWalletBtn.textContent = "Wallet Connected";
            connectWalletBtn.disabled = true;
            console.log("🔄 Wallet auto-connected:", savedWallet);
        }
    }

    connectWalletBtn.addEventListener("click", () => connectWallet(false));

    checkWalletAfterRedirect();
});



