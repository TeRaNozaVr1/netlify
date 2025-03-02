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
                updateWalletUI(response.publicKey.toString());

                console.log("✅ Wallet connected:", response.publicKey.toString());
            } catch (err) {
                console.error("❌ Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
                localStorage.removeItem("phantomWallet"); // Очищуємо дані у разі помилки
            }
        } else {
            console.log("⚠️ Phantom не знайдено. Використовуємо мобільний deeplink...");

            if (/Android|iPhone/i.test(navigator.userAgent)) {
                // ✅ Deeplink для відкриття Phantom через мобільний браузер
                const deeplink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent("https://cool-kataifi-90a5d5.netlify.app")}&dapp_encryption_public_key=&cluster=mainnet-beta&redirect_link=${encodeURIComponent(window.location.href)}`;
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
        const savedWallet = localStorage.getItem("phantomWallet");

        if (savedWallet) {
            updateWalletUI(savedWallet);
        } else if (window.solana && window.solana.isPhantom) {
            // Очікуємо подію connect, якщо користувач підключився через deeplink
            window.solana.on("connect", () => {
                if (window.solana.publicKey) {
                    const newWallet = window.solana.publicKey.toString();
                    localStorage.setItem("phantomWallet", newWallet);
                    updateWalletUI(newWallet);
                }
            });
        }
    }

    connectWalletBtn.addEventListener("click", () => connectWallet(false));

    checkAutoConnect();
});

