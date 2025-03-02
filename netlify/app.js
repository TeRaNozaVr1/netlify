document.addEventListener("DOMContentLoaded", async function () {
  const connectWalletBtn = document.getElementById("connectWalletBtn");
  const walletStatus = document.getElementById("walletStatus");

  async function connectWallet(autoConnect = false) {
    if (window.solana && window.solana.isPhantom) {
      try {
        const response = await window.solana.connect({ onlyIfTrusted: autoConnect });
        const walletAddress = response.publicKey.toString();

        localStorage.setItem("phantomWallet", walletAddress);
        walletStatus.textContent = `Connected: ${walletAddress}`;
        connectWalletBtn.textContent = "Wallet Connected";
        connectWalletBtn.disabled = true;

        console.log("Wallet connected:", walletAddress);
        await confirmWalletAddress(walletAddress); // Підтвердження адреси

      } catch (err) {
        console.error("Connection failed:", err);
        walletStatus.textContent = "Connection failed!";
        localStorage.removeItem("phantomWallet"); // Очищаємо дані у разі помилки
      }
    } else {
      console.log("Phantom не знайдено. Відкриваємо додаток...");
      if (/Android|iPhone/i.test(navigator.userAgent)) {
        const deeplink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent("https://cool-kataifi-90a5d5.netlify.app")}&cluster=mainnet-beta&redirect_link=${encodeURIComponent(window.location.href)}`;
        window.location.href = deeplink;
      } else {
        alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
        window.open("https://phantom.app/", "_blank");
      }
    }
  }

  async function checkAutoConnect() {
    if (!window.solana) {
      console.warn("Solana wallet не знайдено.");
      return;
    }
    const savedWallet = localStorage.getItem("phantomWallet");
    if (savedWallet) {
      await connectWallet(true);
    }
  }

  async function getWalletAddress() {
    return localStorage.getItem("phantomWallet") || null;
  }

  async function confirmWalletAddress(walletAddress) {
    try {
      const response = await fetch('https://cool-kataifi-90a5d5.netlify.app/confirm-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletAddress })
      });

      if (!response.ok) {
        throw new Error(HTTP error! Status: ${response.status});
      }

      const text = await response.text(); // Читаємо текстовий контент
      if (!text) throw new Error("Empty response from server");

      const data = JSON.parse(text); // Парсимо JSON
      if (data.success) {
        console.log('Wallet address confirmed');
      } else {
        console.error('Error confirming wallet address:', data.error);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
  }

  connectWalletBtn.addEventListener("click", () => connectWallet(false));
  checkAutoConnect();
});

