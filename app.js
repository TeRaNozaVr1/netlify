document.addEventListener("DOMContentLoaded", async function () {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");

    async function connectWallet() {
        if ("solana" in window) {
            try {
                const provider = window.solana;
                if (!provider.isPhantom) {
                    alert("Phantom Wallet not found!");
                    return;
                }

                await provider.connect();
                walletStatus.textContent = `Connected: ${provider.publicKey.toString()}`;
                connectWalletBtn.textContent = "Wallet Connected";
                connectWalletBtn.disabled = true;

            } catch (err) {
                console.error("Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
            }
        } else {
            alert("Phantom Wallet is not installed!");
            window.open("https://phantom.app/", "_blank");
        }
    }

    connectWalletBtn.addEventListener("click", connectWallet);
});

