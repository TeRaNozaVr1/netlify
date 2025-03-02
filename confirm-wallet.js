const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ success: false, error: "Wallet address is required" });
  }

  console.log("Wallet address received:", walletAddress);

  // Тут можна додати логіку збереження адреси в базу або перевірки
  res.json({ success: true, message: "Wallet address confirmed" });
});

module.exports = router;
