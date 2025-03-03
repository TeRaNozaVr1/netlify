const { Connection, PublicKey, Transaction, Token } = solanaWeb3;

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
const amountInput = document.getElementById("amount");
const walletInput = document.getElementById("walletAddress");
const tokenSelect = document.getElementById("tokenSelect");

// Константа для ціни вашого токена
const TOKEN_PRICE = 0.00048;  // 1 токен = 0.00048 $

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

    const mintAddress = selectedToken === "USDT" ? USDT_MINT_ADDRESS : USDC_MINT_ADDRESS;
    
    await exchangeTokens(userWalletAddress, amount, mintAddress);
});

async function exchangeTokens(userWalletAddress, amountInUSDT, mintAddress) {
    try {
        const tokensToSend = Math.floor(amountInUSDT / TOKEN_PRICE);
        const transaction = new Transaction();
        const sender = new PublicKey(userWalletAddress);

        // Інструкція для переводу USDT/USDC від користувача до вашого гаманця
        const transferUSDTInstruction = Token.createTransferInstruction(
            solanaWeb3.TOKEN_PROGRAM_ID,
            await getAssociatedTokenAddress(sender, mintAddress),
            await getAssociatedTokenAddress(RECEIVER_WALLET_ADDRESS, mintAddress),
            sender,
            [],
            amountInUSDT * 10 ** 6 // USDT/USDC мають 6 знаків після коми
        );

        transaction.add(transferUSDTInstruction);

        // Інструкція для відправки SPL токенів користувачеві
        const transferSPLInstruction = Token.createTransferInstruction(
            solanaWeb3.TOKEN_PROGRAM_ID,
            await getAssociatedTokenAddress(RECEIVER_WALLET_ADDRESS, SPL_TOKEN_ADDRESS),
            await getAssociatedTokenAddress(sender, SPL_TOKEN_ADDRESS),
            RECEIVER_WALLET_ADDRESS,
            [],
            tokensToSend
        );

        transaction.add(transferSPLInstruction);

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sender;

        // Підпис транзакції в Phantom
        const signedTransaction = await window.solana.signTransaction(transaction);

        // Відправка транзакції
        const txid = await connection.sendRawTransaction(signedTransaction.serialize());

        alert(`Транзакція успішна! ID: ${txid}`);

    } catch (err) {
        console.error("Помилка обміну:", err);
        alert("Помилка при обміні. Спробуйте ще раз.");
    }
}

async function getAssociatedTokenAddress(owner, mint) {
    return (await connection.getParsedTokenAccountsByOwner(owner, { mint })).value[0]?.pubkey;
}






