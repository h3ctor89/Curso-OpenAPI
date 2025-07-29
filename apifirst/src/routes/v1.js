// routes/v2.js
const express = require("express");
const router = express.Router();

router.get("/hello", (req, res) => {
    res.json({ message: "hello world v2", version: "v2", date: new Date() });
});

module.exports = router;    