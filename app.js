import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";

const wallets = [new PhantomWalletAdapter()];

function App() {
    return (
        <WalletProvider wallets={wallets} autoConnect>
            <WalletConnect />
        </WalletProvider>
    );
}

function WalletConnect() {
    const { connect, connected, publicKey } = useWallet();

    return (
        <div>
            {connected ? (
                <p>Connected: {publicKey.toBase58()}</p>
            ) : (
                <button onClick={connect}>Connect Wallet</button>
            )}
        </div>
    );
