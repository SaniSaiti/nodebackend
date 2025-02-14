const express = require("express");
const pool = require("../db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Arbeitszeit starten
router.post("/start", authMiddleware, async(req, res) => {
    try {
        const { user_id } = req.user;
        const result = await pool.query(
            "INSERT INTO work_logs (user_id, start_time) VALUES ($1, NOW()) RETURNING *", [user_id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Arbeitszeit beenden
router.post("/end", authMiddleware, async(req, res) => {
    try {
        const { user_id } = req.user;
        const result = await pool.query(
            "UPDATE work_logs SET end_time = NOW() WHERE user_id = $1 AND end_time IS NULL RETURNING *", [user_id]
        );
        res.json(result.rows[0] || { message: "Keine offene Arbeitszeit gefunden" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Alle Arbeitszeiten des Nutzers abrufen
router.get("/", authMiddleware, async(req, res) => {
    try {
        const { user_id } = req.user;
        const result = await pool.query("SELECT * FROM work_logs WHERE user_id = $1", [user_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;