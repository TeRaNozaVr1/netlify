document.addEventListener("DOMContentLoaded", async function () {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");

    async function connectWallet(autoConnect = false) {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect({ onlyIfTrusted: autoConnect });

                if (response.publicKey) {
                    const walletAddress = response.publicKey.toString();
                    localStorage.setItem("phantomWallet", walletAddress);
                    updateWalletUI(walletAddress);
                    console.log("✅ Wallet connected:", walletAddress);
                }
            } catch (err) {
                console.error("❌ Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
                localStorage.removeItem("phantomWallet"); 
            }
        } else {
            console.log("⚠️ Phantom не знайдено. Використовуємо мобільний deeplink...");

            if (/Android|iPhone/i.test(navigator.userAgent)) {
                const deeplink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent("https://cool-kataifi-90a5d5.netlify.app")}&redirect_link=${encodeURIComponent(window.location.href)}`;
                window.location.href = deeplink;
            } else {
                alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
                window.open("https://phantom.app/", "_blank");
            }
        }
    }

    function updateWalletUI(walletAddress) {
        walletStatus.textContent = `Connected: ${walletAddress}`;
        connectWalletBtn.textContent = "Wallet Connected";
        connectWalletBtn.disabled = true;
    }

    async function checkAutoConnect() {
        if (window.solana && window.solana.isPhantom) {
            window.solana.on("connect", () => {
                if (window.solana.publicKey) {
                    const walletAddress = window.solana.publicKey.toString();
                    localStorage.setItem("phantomWallet", walletAddress);
                    updateWalletUI(walletAddress);
                }
            });

            try {
                const response = await window.solana.connect({ onlyIfTrusted: true });
                if (response.publicKey) {
                    const walletAddress = response.publicKey.toString();
                    localStorage.setItem("phantomWallet", walletAddress);
                    updateWalletUI(walletAddress);
                }
            } catch (err) {
                console.log("🔄 Автопідключення не вдалося, очікуємо дію користувача.");
            }
        }

        const savedWallet = localStorage.getItem("phantomWallet");
        if (savedWallet) {
            updateWalletUI(savedWallet);
        }
    }

    connectWalletBtn.addEventListener("click", () => connectWallet(false));

    checkAutoConnect();
});

