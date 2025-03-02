document.addEventListener("DOMContentLoaded", async function () { 
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");

    async function connectWallet(autoConnect = false) {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect({ onlyIfTrusted: autoConnect });

                localStorage.setItem("phantomWallet", response.publicKey.toString());

                walletStatus.textContent = `Connected: ${response.publicKey.toString()}`;
                connectWalletBtn.textContent = "Wallet Connected";
                connectWalletBtn.disabled = true;

                console.log("✅ Wallet connected:", response.publicKey.toString());
            } catch (err) {
                console.error("❌ Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
                localStorage.removeItem("phantomWallet");
            }
        } else {
            console.log("⚠️ Phantom не знайдено. Відкриваємо додаток...");

            if (/Android|iPhone/i.test(navigator.userAgent)) {
                const deeplink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent(window.location.origin)}&redirect_link=${encodeURIComponent(window.location.href)}`;

                // Перевіряємо браузер
                if (navigator.userAgent.includes("SamsungBrowser")) {
                    // Якщо Samsung Internet, перенаправляємо в Play Store
                    window.location.href = "https://play.google.com/store/apps/details?id=app.phantom";
                } else {
                    window.location.href = deeplink;
                }
            } else {
                alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
                window.open("https://phantom.app/", "_blank");
            }
        }
    }

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

    checkWalletAfterRedirect();
});
