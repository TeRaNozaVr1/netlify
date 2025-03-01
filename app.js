document.addEventListener("DOMContentLoaded", async function () {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");

    async function connectWallet() {
        if (window.solana && window.solana.isPhantom) {
            try {
                const provider = window.solana;
                const response = await provider.connect();
                
                walletStatus.textContent = `Connected: ${response.publicKey.toString()}`;
                connectWalletBtn.textContent = "Wallet Connected";
                connectWalletBtn.disabled = true;
            } catch (err) {
                console.error("Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
            }
        } else {
            alert("Phantom Wallet is not detected. Please install it.");
            window.open("https://phantom.app/", "_blank");
        }
    }

    connectWalletBtn.addEventListener("click", connectWallet);
});


