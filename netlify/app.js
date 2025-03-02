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
        console.log("Wallet connected:", response.publicKey.toString());
      } catch (err) {
        console.error("Connection failed:", err);
        walletStatus.textContent = "Connection failed!";
        localStorage.removeItem("phantomWallet"); // Очищуємо дані у разі помилки
      }
    } else {
      console.log("Phantom не знайдено. Відкриваємо додаток...");
      if (/Android|iPhone/i.test(navigator.userAgent)) {
        // Правильний deeplink, що гарантує запит дозволу!
        const deeplink = `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent("https://cool-kataifi-90a5d5.netlify.app")}&dapp_encryption_public_key=&cluster=mainnet-beta&redirect_link=${encodeURIComponent(window.location.href)}&public_key=${encodeURIComponent(response.publicKey.toString())}`;
        window.location.href = deeplink;
      } else {
        alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
        window.open("https://phantom.app/", "_blank");
      }
    }
  }

  async function checkAutoConnect() {
    const savedWallet = localStorage.getItem("phantomWallet");
    if (savedWallet) {
      await connectWallet(true);
    }
  }

  connectWalletBtn.addEventListener("click", () => connectWallet(false));
  checkAutoConnect();
  async function getWalletAddress() {
  const savedWallet = localStorage.getItem("phantomWallet");
  if (savedWallet) {
    return savedWallet;
  } else {
    return null;
  }
}

async function confirmWalletAddress() {
  const walletAddress = await getWalletAddress();
  if (walletAddress) {
    // Call your API or backend to confirm the wallet address
    const response = await fetch('/api/confirm-wallet-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ walletAddress: walletAddress })
    });
    const data = await response.json();
    if (data.success) {
      console.log('Wallet address confirmed');
    } else {
      console.error('Error confirming wallet address:', data.error);
    }
  }
}

// Call confirmWalletAddress when the wallet is connected
connectWalletBtn.addEventListener("click", async () => {
  await connectWallet(false);
  await confirmWalletAddress();
});
