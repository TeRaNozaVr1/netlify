document.addEventListener("DOMContentLoaded", async function () {
    const walletStatus = document.getElementById("walletStatus");

    async function checkWalletConnection() {
        try {
            const response = await fetch("https://cool-kataifi-90a5d5.netlify.app", {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) throw new Error("Failed to fetch wallet data");

            const data = await response.json();
            if (data.walletAddress) {
                walletStatus.textContent = `Connected: ${data.walletAddress}`;
            } else {
                walletStatus.textContent = "Wallet not connected";
            }
        } catch (err) {
            console.error("❌ Error fetching wallet status:", err);
            walletStatus.textContent = "Connection error!";
        }
    }


    // Якщо відкриття йде з мобільного, використовуємо deeplink для підключення
    if (/Android|iPhone/i.test(navigator.userAgent)) {
        const deeplink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent("https://cool-kataifi-90a5d5.netlify.app")}&dapp_encryption_public_key=&cluster=mainnet-beta&redirect_link=${encodeURIComponent("https://cool-kataifi-90a5d5.netlify.app/wallet-callback")}`;
        window.location.href = deeplink;
    } else {
        alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
        window.open("https://phantom.app/", "_blank");
    }
});






