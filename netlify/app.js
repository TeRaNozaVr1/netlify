document.addEventListener("DOMContentLoaded", function () { 
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletStatus = document.getElementById("walletStatus");
    const walletPopup = document.getElementById("walletPopup");
    const exchangeBtn = document.getElementById("exchangeBtn");
    const amountInput = document.getElementById("amount");
    const tokenSelect = document.getElementById("tokenSelect");

    const { Connection, PublicKey, SystemProgram, Transaction } = solanaWeb3;
    const endpoint = "https://api.mainnet-beta.solana.com";
    const connection = new Connection(endpoint, "confirmed");
    const USDT_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
    const USDC_MINT_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU");
    const SPL_TOKEN_ADDRESS = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo");

    function isMobile() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    function getWallet(walletType) {
        if (walletType === "phantom" && window.phantom?.solana?.isPhantom) {
            return window.phantom.solana;
        } else if (walletType === "solflare" && window.solflare?.isSolflare) {
            return window.solflare;
        }
        return null;
    }

    function closePopup() {
        walletPopup.classList.remove("show-popup");
    }

    async function connectWallet(walletType) {
        closePopup();
        let wallet = getWallet(walletType);

        if (!wallet) {
            alert(`Будь ласка, встановіть ${walletType === "phantom" ? "Phantom Wallet" : "Solflare"}`);
            if (walletType === "phantom") {
                window.open("https://phantom.app/", "_blank");
            } else {
                window.open("https://solflare.com/", "_blank");
            }
            return;
        }

        try {
            const response = await wallet.connect();
            localStorage.setItem("walletType", walletType);
            localStorage.setItem("walletAddress", response.publicKey.toString());

            walletStatus.textContent = `Гаманець підключено: ${response.publicKey.toString()}`;
            connectWalletBtn.textContent = "Wallet Connected";
            connectWalletBtn.disabled = true;
        } catch (err) {
            console.error("Помилка підключення:", err);
            walletStatus.textContent = "Помилка підключення!";
        }
    }

    // Робимо функцію глобальною
    window.connectWallet = connectWallet;

    async function getTokenBalance(ownerAddress, mintAddress) {
        try {
            const response = await connection.getParsedTokenAccountsByOwner(ownerAddress, { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") });
            const account = response.value.find(acc => acc.account.data.parsed.info.mint === mintAddress.toString());
            return account ? parseFloat(account.account.data.parsed.info.tokenAmount.uiAmount) : 0;
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

        const walletType = localStorage.getItem("walletType");
        let wallet = getWallet(walletType);
        if (!wallet || !wallet.publicKey) {
            alert("Будь ласка, підключіть гаманець");
            return;
        }

        const token = tokenSelect.value;
        const mintAddress = token === "USDT" ? USDT_MINT_ADDRESS : USDC_MINT_ADDRESS;
        const balance = await getTokenBalance(wallet.publicKey, mintAddress);

        if (balance < amount) {
            alert("Недостатньо коштів для обміну!");
            return;
        }

        await exchangeTokens(wallet, amount, mintAddress);
    });

    async function exchangeTokens(wallet, amount, mintAddress) {
        try {
            const transaction = new Transaction();
            const sender = wallet.publicKey;

            const transferInstruction = SystemProgram.transfer({
                fromPubkey: sender,
                toPubkey: SPL_TOKEN_ADDRESS,
                lamports: amount * 1000000000
            });

            transaction.add(transferInstruction);
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = sender;

            const signedTransaction = await wallet.signTransaction(transaction);
            const txid = await connection.sendRawTransaction(signedTransaction.serialize(), { skipPreflight: false, preflightCommitment: "confirmed" });

            await connection.confirmTransaction(txid);
            console.log(`Транзакція успішно надіслана! TXID: ${txid}`);
            alert(`Обмін завершено! TXID: ${txid}`);
        } catch (err) {
            console.error("Помилка обміну:", err);
            alert("Помилка при обміні. Спробуйте ще раз.");
        }
    }
});



    async function getAssetsByOwner(ownerAddress) {
        const body = {
            jsonrpc: "2.0",
            method: "getAssetsByOwner",
            params: {
                ownerAddress: ownerAddress.toString(),
                limit: 10,
                page: 1
            },
            id: 1
        };

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            console.log("Активи власника:", data);
            return data.result;
        } catch (error) {
            console.error("Помилка отримання активів:", error);
        }
    }

    async function getSignaturesForAssetV2(assetId) {
        const body = {
            jsonrpc: "2.0",
            id: "string",
            method: "getSignaturesForAssetV2",
            params: {
                id: assetId,
                page: 1,
                limit: 100
            }
        };

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            console.log("Історія транзакцій:", data);
            return data.result;
        } catch (error) {
            console.error("Помилка отримання історії:", error);
        }
    }
