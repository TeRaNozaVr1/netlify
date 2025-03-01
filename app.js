document.addEventListener("DOMContentLoaded", function () {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");

    async function connectWallet() {
        if (window.solana && window.solana.isPhantom) {
            try {
                // Запит на підключення гаманця
                const response = await window.solana.connect({ onlyIfTrusted: false });
                walletStatus.textContent = `Connected: ${response.publicKey.toString()}`;
                connectWalletBtn.textContent = "Wallet Connected";
                connectWalletBtn.disabled = true;
            } catch (err) {
                console.error("Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
            }
        } else {
            // Використовуємо deeplink для мобільних пристроїв
            if (/Android|iPhone/i.test(navigator.userAgent)) {
                const deeplink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent(window.location.origin)}&redirect_link=${encodeURIComponent(window.location.href)}`;
                window.location.href = deeplink;
            } else {
                alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
                window.open("https://phantom.app/", "_blank");
            }
        }
    }

    connectWalletBtn.addEventListener("click", connectWallet);
});




