const express = require("express");
const pool = require("../db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Arbeitszeiten, Urlaub oder Krankheitszeiten eintragen
router.post("/", authMiddleware, async(req, res) => {
    console.log('requser ', req.user.id);

    try {
        const user_id = req.user.id; // User-ID aus dem Token
        console.log('user', user_id);

        const { entry_type, date_start, date_end, start_time, end_time, is_night_shift } = req.body;

        // 🛑 Validierung: entry_type muss "work", "vacation" oder "sick" sein
        const validTypes = ["work", "vacation", "sick"];
        if (!validTypes.includes(entry_type)) {
            return res.status(400).json({ error: "Ungültiger entry_type! Erlaubt sind nur 'work', 'vacation' oder 'sick'." });
        }

        // 🛑 Validierung: start_time & end_time nur, wenn entry_type "work" ist
        if (entry_type === "work" && (!start_time || !end_time)) {
            return res.status(400).json({ error: "Arbeitszeit benötigt Start- und Endzeit!" });
        }

        // 🛑 Validierung: date_start und date_end sind erforderlich
        if (!date_start || !date_end) {
            return res.status(400).json({ error: "Start- und Enddatum sind erforderlich!" });
        }

        // 🛑 Wenn entry_type 'work' ist, sollte die Nachtarbeit-Option vorhanden sein
        if (entry_type === "work" && is_night_shift === undefined) {
            return res.status(400).json({ error: "Bitte geben Sie an, ob es sich um Nachtarbeit handelt." });
        }

        // SQL-Abfrage: Je nach entry_type anpassen
        let result;
        if (entry_type === "work") {
            result = await pool.query(
                `INSERT INTO work_logs (user_id, entry_type, date_start, date_end, start_time, end_time, is_night_shift) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [user_id, entry_type, date_start, date_end, start_time, end_time, is_night_shift]
            );
        } else {
            result = await pool.query(
                `INSERT INTO work_logs (user_id, entry_type, date_start, date_end) 
                VALUES ($1, $2, $3, $4) RETURNING *`, [user_id, entry_type, date_start, date_end]
            );
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


// GET /api/worklogs/:userId (Arbeitszeiteinträge für einen bestimmten Benutzer abrufen)
router.get("/:userId", authMiddleware, async(req, res) => {
    console.log(req.params);
    console.log('res', res);


    const userId = req.params.userId;
    console.log('userID', userId);


    try {
        // SQL-Abfrage für Arbeitszeiteinträge eines bestimmten Benutzers
        const result = await pool.query(
            `SELECT * FROM work_logs WHERE user_id = $1 ORDER BY created_at DESC`, [userId]
        );

        res.json(result.rows); // Rückgabe der Arbeitszeiteinträge des Benutzers
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});





module.exports = router;