const { Connection, PublicKey, SystemProgram, Transaction, Keypair } = solanaWeb3;

// Підключення до Solana мережі (mainnet-beta)
const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');
console.log(connection);

// Елементи UI
const connectWalletBtn = document.getElementById('connectWalletBtn');
const walletStatus = document.getElementById('walletStatus');
const exchangeBtn = document.getElementById('exchangeBtn');
const resultDiv = document.getElementById('result');
const amountInput = document.getElementById('amount');

// Встановлення гаманця Phantom (або Solflare)
let wallet = window.solana;

connectWalletBtn.addEventListener('click', async () => {
    if (!wallet) {
        alert("Будь ласка, встановіть Phantom Wallet або Solflare");
        return;
    }

    try {
        await wallet.connect();
        walletStatus.textContent = `Гаманець підключено: ${wallet.publicKey.toString()}`;
    } catch (err) {
        console.log('Помилка підключення до гаманця:', err);
    }
});

// Обмін токенів
exchangeBtn.addEventListener('click', async () => {
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert("Будь ласка, введіть коректну кількість USDT");
        return;
    }

    // Викликаємо функцію обміну
    await exchangeTokens(wallet, amount);
});

// Функція для обміну токенів
async function exchangeTokens(wallet, amountInUSDT) {
    try {
        // Адреси гаманців
        const recipientAddress = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"); // Гаманець отримувача USDT/USDC
        const senderAddress = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo"); // Гаманець з токенами

        // Розрахунок кількості токенів для обміну
        const tokenPrice = 0.00048; // Вартість одного токена в USDT/USDC
        const tokenAmount = Math.floor(amountInUSDT / tokenPrice); // Кількість токенів для відправлення

        // Перевірка балансу
        const senderBalance = await connection.getBalance(senderAddress);
        if (senderBalance < tokenAmount) {
            alert("Недостатньо токенів для обміну.");
            return;
        }

        // Створення транзакції для переказу токенів
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: senderAddress,
                toPubkey: recipientAddress,
                lamports: tokenAmount
            })
        );

        // Підписання та надсилання транзакції
        transaction.feePayer = wallet.publicKey;
        const signedTransaction = await wallet.signTransaction(transaction);
        const txid = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction(txid);

        console.log(`Транзакція успішно надіслана! TXID: ${txid}`);

        // Відображення результату
        resultDiv.style.display = 'block';
        resultDiv.textContent = `Обмін успішно завершено! TXID: ${txid}`;
    } catch (err) {
        console.log('Помилка обміну токенів:', err);
        resultDiv.style.display = 'block';
        resultDiv.textContent = 'Помилка при обміні токенів. Спробуйте ще раз.';
    }
}

