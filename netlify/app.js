const { Connection, PublicKey, Transaction, SystemProgram, Token } = solanaWeb3;

// Solana RPC
const endpoint = "https://mainnet.helius-rpc.com/?api-key=62d6c036-5371-452d-b852-3d6f6823e08f";
const connection = new Connection(endpoint, "confirmed");

// Адреси токенів
const USDT_MINT_ADDRESS = new PublicKey("Es9vMFr8Hg9NQ29gHks4vWZ3VpH5p89H5VzwgrGzF8jz");  // USDT
const USDC_MINT_ADDRESS = new PublicKey("AqRHwbMkFztV1gX9EzTUb9c6Ho68HT4kJgLxg32ptaxw");  // USDC
const RECEIVER_WALLET_ADDRESS = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"); // Гаманець для отримання USDT/USDC
const SPL_TOKEN_ADDRESS = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo"); // Адреса SPL токена для відправки

// UI елементи
const exchangeBtn = document.getElementById("exchangeBtn");
const resultDiv = document.getElementById("result");
const amountInput = document.getElementById("amount");
const walletInput = document.getElementById("walletAddress");
const tokenSelect = document.getElementById("tokenSelect");

// Константа для ціни вашого токена
const TOKEN_PRICE = 0.00048;  // 1 токен = 0.00048 $

// Функція для отримання балансу токенів
async function getTokenBalance(ownerAddress, mintAddress) {
    try {
        const response = await connection.getParsedTokenAccountsByOwner(
            new PublicKey(ownerAddress),
            { programId: TOKEN_PROGRAM_ID }
        );

        if (!response.value || response.value.length === 0) {
            return 0;
        }

        const account = response.value.find(acc => acc.account.data.parsed.info.mint === mintAddress.toBase58());
        return account ? parseFloat(account.account.data.parsed.info.tokenAmount.uiAmount) : 0;
    } catch (error) {
        console.error("Помилка отримання балансу:", error);
        return 0;
    }
}
// Обмін токенів
exchangeBtn.addEventListener("click", async () => {
    const amount = parseFloat(amountInput.value);
    const userWalletAddress = walletInput.value.trim();
    const selectedToken = tokenSelect.value;

    if (!userWalletAddress) {
        alert("Будь ласка, введіть адресу Solana-гаманця");
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("Будь ласка, введіть коректну кількість USDT/USDC");
        return;
    }

    // Вибір токена для обміну
    const mintAddress = selectedToken === "USDT" ? USDT_MINT_ADDRESS : USDC_MINT_ADDRESS;
    const balance = await getTokenBalance(userWalletAddress, mintAddress);

    if (balance < amount) {
        alert(Недостатньо коштів для обміну ${selectedToken}!);
        return;
    }

    await exchangeTokens(userWalletAddress, amount, mintAddress);
});

// Функція для обміну USDT/USDC на SPL токени
async function exchangeTokens(userWallet, amountInUSDT, mintAddress) {
    try {
        const sender = new PublicKey(userWallet);
        const senderTokenAccount = await getAssociatedTokenAddress(mintAddress, sender);
        const receiverTokenAccount = await getAssociatedTokenAddress(mintAddress, RECEIVER_WALLET_ADDRESS);

        const transaction = new Transaction().add(
            createTransferInstruction(
                senderTokenAccount,
                receiverTokenAccount,
                sender,
                amountInUSDT * 10 ** 6 // USDT/USDC мають 6 десяткових знаків
            )
        );

        console.log("Транзакція створена:", transaction);
        alert("Підпишіть транзакцію у гаманці");
        return transaction;
    } catch (err) {
        console.error("Помилка обміну:", err);
    }
}


        // Створення інструкції для відправки SPL токенів
        const token = new Token(connection, SPL_TOKEN_ADDRESS, solanaWeb3.TOKEN_PROGRAM_ID, sender); // Ініціалізація токена
        (async () => {
    const transaction = await exchangeTokens(userWallet, amountInUSDT, mintAddress);
    console.log("Згенерована транзакція:", transaction);
})();

        const transferTokenInstruction = Token.createTransferInstruction(
            solanaWeb3.TOKEN_PROGRAM_ID,
            senderTokenAccount.address, // Адреса токен-аккаунту користувача
            RECEIVER_WALLET_ADDRESS, // Адреса отримувача
            sender, // Підписант
            [],
            tokensToSend // Кількість токенів для відправки
        );

        transaction.add(transferTokenInstruction);

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sender;

        alert("Зараз згенерується транзакція, підпишіть її у своєму гаманці");
        console.log("Згенерована транзакція:", transaction);

        resultDiv.style.display = "block";
        resultDiv.textContent = Ви отримаєте ${tokensToSend} токенів за ${amountInUSDT} ${selectedToken}. Підпишіть транзакцію у своєму гаманці.;
    } catch (err) {
        console.error("Помилка обміну:", err);
        resultDiv.style.display = "block";
        resultDiv.textContent = "Помилка при обміні. Спробуйте ще раз.";
    }
}



