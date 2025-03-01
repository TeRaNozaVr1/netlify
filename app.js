import { Buffer } from 'buffer';
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
        // Токен для обміну
        const usdtMintAddress = new PublicKey("4ofLfgCmaJYC233vTGv78WFD4AfezzcMiViu26dF3cVU"); // Замінити на адресу USDT
        const splTokenAddress = new PublicKey("3EwV6VTHYHrkrZ3UJcRRAxnuHiaeb8EntqX85Khj98Zo"); // Замінити на адресу SPL токена

        // Створення транзакції для обміну
        const transaction = new Transaction();
        const sender = wallet.publicKey;

        // Приклад: надсилання USDT на іншу адресу (реалізація залежить від конкретного сценарію обміну)
        const transferInstruction = SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: splTokenAddress,
            lamports: amountInUSDT * 1000000000 // Перетворення USDT на лампорти (як приклад)
        });

        transaction.add(transferInstruction);

        // Підтвердження транзакції
        const signature = await wallet.signTransaction(transaction);

        // Надсилання транзакції
        const txid = await connection.sendRawTransaction(signature.serialize());
        await connection.confirmTransaction(txid);

        console.log(`Транзакція успішно надіслана! TXID: ${txid}`);

        // Показуємо результат
        resultDiv.style.display = 'block';
        resultDiv.textContent = `Обмін успішно завершено! TXID: ${txid}`;
    } catch (err) {
        console.log('Помилка обміну токенів:', err);
        resultDiv.style.display = 'block';
        resultDiv.textContent = 'Помилка при обміні токенів. Спробуйте ще раз.';
    }
}
window.Buffer = Buffer;
