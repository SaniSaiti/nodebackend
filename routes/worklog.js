const express = require("express");
const pool = require("../db");
const { authMiddleware, checkRole } = require("../middleware/auth");

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

// PUT Route für Worklogs-Aktualisierung (nur Admin)
router.put("/:id", authMiddleware, checkRole(["admin"]), async(req, res) => {
    console.log("Request Body:", req.body);

    const { user_id, entry_type, date_start, date_end, start_time, end_time, is_night_shift, id } = req.body;

    try {
        const result = await pool.query(
            `UPDATE work_logs
            SET user_id = $1, entry_type = $2, date_start = $3, date_end = $4, start_time = $5, end_time = $6, is_night_shift = $7, updated_at = NOW()
            WHERE id = $8 RETURNING *`, [user_id, entry_type, date_start, date_end, start_time, end_time, is_night_shift, id]
        );

        if (result.rows.length > 0) {
            res.json({ message: "Worklog erfolgreich aktualisiert", worklog: result.rows[0] });
        } else {
            res.status(404).json({ error: "Worklog nicht gefunden" });
        }
    } catch (error) {
        console.error("Update Fehler:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});


// DELETE Route für Worklogs (nur Admin)
router.delete("/:id", authMiddleware, checkRole(["admin"]), async(req, res) => {
    const worklogId = parseInt(req.params.id, 10);
    console.log('worklogId', worklogId);


    try {
        const result = await pool.query("DELETE FROM work_logs WHERE id = $1 RETURNING *", [worklogId]);

        if (result.rows.length > 0) {
            res.json({ message: "Worklog erfolgreich gelöscht", worklog: result.rows[0] });
        } else {
            res.status(404).json({ error: "Worklog nicht gefunden" });
        }
    } catch (error) {
        console.error("Löschfehler:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});


module.exports = router;