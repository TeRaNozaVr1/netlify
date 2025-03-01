document.addEventListener("DOMContentLoaded", async function () {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");

    async function connectWallet(autoConnect = false) {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect({ onlyIfTrusted: autoConnect });

                if (response.publicKey) {
                    const walletAddress = response.publicKey.toString();

                    // ✅ Зберігаємо адресу гаманця
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
            console.log("⚠️ Phantom не знайдено. Відкриваємо додаток...");

            if (/Android|iPhone/i.test(navigator.userAgent)) {
                // 📲 **Оновлений deeplink для відкриття у додатку Phantom**
                const deeplink = `phantom://ul/v1/connect?app_url=${encodeURIComponent("https://cool-kataifi-90a5d5.netlify.app")}&redirect_link=${encodeURIComponent(window.location.href)}`;
                
                // ❗️ Використовуємо прихований iframe для кращого виклику додатку
                let iframe = document.createElement("iframe");
                iframe.style.display = "none";
                iframe.src = deeplink;
                document.body.appendChild(iframe);

                // 🕒 Видаляємо iframe через 3 секунди
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 3000);
            } else {
                alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
                window.open("https://phantom.app/", "_blank");
            }
        }
    }

    // ✅ Автоматичне підключення після редіректу
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


