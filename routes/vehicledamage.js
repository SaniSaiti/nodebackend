const express = require("express");
const pool = require("../db");
const { authMiddleware, checkRole } = require("../middleware/auth");

const router = express.Router();

// Fahrzeug Schaden hinzufügen (nur Admin)
router.post("/", authMiddleware, checkRole(["admin"]), async(req, res) => {
    console.log("User ID:", req.user.id);

    const { vehicle_id, damage_description, damage_date, status, is_driveable, image_url } = req.body;
    const user_id = req.user.id;

    try {
        const result = await pool.query(
            `INSERT INTO vehicle_damage (vehicle_id, user_id, damage_description, damage_date, status, is_driveable, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [vehicle_id, user_id, damage_description, damage_date, status, is_driveable, image_url]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Fehler beim Hinzufügen eines Fahrzeugschadens:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});


// Alle FahrzeugeSchäden abrufen abrufen
router.get("/", authMiddleware, async(req, res) => {
    try {
        const result = await pool.query("SELECT * FROM vehicle_damage");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Für 1 bestimmtes Fahrzeug Schaden abrufen
router.get("/:vehicle_id", authMiddleware, async(req, res) => {
    const vehicleId = req.params.vehicle_id;
    console.log('Vehicle ID:', vehicleId);

    try {
        // SQL-Abfrage für Schäden eines bestimmten Fahrzeugs
        const result = await pool.query(
            `SELECT * FROM vehicle_damage WHERE vehicle_id = $1 ORDER BY damage_date DESC`, [vehicleId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Fehler beim Abrufen der Fahrzeugschäden:", error);
        res.status(500).json({ error: error.message });
    }
});

// PUT Route für Vehicle Damage Aktualisierung (nur Admin)
router.put("/:id", authMiddleware, checkRole(["admin"]), async(req, res) => {
    console.log("Request Body:", req.body);

    const { damage_date, damage_description, status, is_driveable, image_url } = req.body;
    const damageId = parseInt(req.params.id, 10);

    try {
        const result = await pool.query(
            `UPDATE vehicle_damage
            SET damage_date = $1, damage_description = $2, status = $3, is_driveable = $4, image_url = $5, updated_at = NOW()
            WHERE id = $6 RETURNING *`, [damage_date, damage_description, status, is_driveable, image_url, damageId]
        );

        if (result.rows.length > 0) {
            res.json({ message: "Fahrzeugschaden erfolgreich aktualisiert", vehicle_damage: result.rows[0] });
        } else {
            res.status(404).json({ error: "Fahrzeugschaden nicht gefunden" });
        }
    } catch (error) {
        console.error("Update Fehler:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

// DELETE Route für Vehicle Damage (nur Admin)
router.delete("/:id", authMiddleware, checkRole(["admin"]), async(req, res) => {
    const damageId = parseInt(req.params.id, 10);
    console.log("Damage ID:", damageId);

    try {
        const result = await pool.query("DELETE FROM vehicle_damage WHERE id = $1 RETURNING *", [damageId]);

        if (result.rows.length > 0) {
            res.json({ message: "Fahrzeugschaden erfolgreich gelöscht", vehicle_damage: result.rows[0] });
        } else {
            res.status(404).json({ error: "Fahrzeugschaden nicht gefunden" });
        }
    } catch (error) {
        console.error("Löschfehler:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});



module.exports = router;