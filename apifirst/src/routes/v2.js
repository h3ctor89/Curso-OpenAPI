// routes/v1.js
const express = require("express");
const router = express.Router();

router.get("/hello", (req, res) => {
    res.json({ message: "hello world" });
});

module.exports = router;