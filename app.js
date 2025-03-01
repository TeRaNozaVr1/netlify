document.addEventListener("DOMContentLoaded", function () {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");

    async function connectWallet() {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect();
                walletStatus.textContent = `Connected: ${response.publicKey.toString()}`;
                connectWalletBtn.textContent = "Wallet Connected";
                connectWalletBtn.disabled = true;
            } catch (err) {
                console.error("Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
            }
        } else {
            // Якщо Phantom не знайдено, використовуємо мобільний deeplink
            if (/Android|iPhone/i.test(navigator.userAgent)) {
                window.location.href = "https://phantom.app/ul/v1/connect?app_url=https://cool-kataifi-90a5d5.netlify.app";
            } else {
                alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
                window.open("https://phantom.app/", "_blank");
            }
        }
    }

    connectWalletBtn.addEventListener("click", connectWallet);
});



