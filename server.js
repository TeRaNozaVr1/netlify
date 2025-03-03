require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 8080;
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

app.use(cors());
app.use(express.json());

app.post("/proxy", async (req, res) => {
    try {
        const response = await axios.post(SOLANA_RPC_URL, req.body, {
            headers: { "Content-Type": "application/json" },
        });
        res.json(response.data);
    } catch (error) {
        console.error("RPC Proxy Error:", error.message);
        res.status(500).json({ error: "RPC request failed" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 CORS Proxy запущено на порту ${PORT}`);
});
