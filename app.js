document.addEventListener("DOMContentLoaded", function () {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");

    async function connectWallet() {
        if (window.solana && window.solana.isPhantom) {
            try {
                // Запит на дозвіл на підключення, перегляд балансу та історії транзакцій
                const response = await window.solana.connect({ onlyIfTrusted: false });

                // Відображення публічного ключа після підключення
                walletStatus.textContent = `Connected: ${response.publicKey.toString()}`;
                connectWalletBtn.textContent = "Wallet Connected";
                connectWalletBtn.disabled = true;

                // Отримання інформації про баланс
                const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));
                const balance = await connection.getBalance(response.publicKey);
                console.log(`Balance: ${balance / solanaWeb3.LAMPORTS_PER_SOL} SOL`);

                // Перевірка історії транзакцій
                const transactions = await connection.getConfirmedSignaturesForAddress2(response.publicKey);
                console.log("Recent transactions:", transactions);
            } catch (err) {
                console.error("Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
            }
        } else {
            // Для мобільних пристроїв відкриваємо Phantom через deeplink
            if (/Android|iPhone/i.test(navigator.userAgent)) {
                const deeplink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent("https://cool-kataifi-90a5d5.netlify.app")}&redirect_link=${encodeURIComponent(window.location.href)}`;
                window.location.href = deeplink;
            } else {
                alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
                window.open("https://phantom.app/", "_blank");
            }
        }
    }

    connectWalletBtn.addEventListener("click", connectWallet);
});





