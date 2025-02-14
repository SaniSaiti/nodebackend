const express = require("express");
const pool = require("../db");
const { authMiddleware, checkRole } = require("../middleware/auth");

const router = express.Router();

// Fahrzeug hinzufügen (nur Admin)
router.post("/", authMiddleware, checkRole(["admin"]), async(req, res) => {
    const { name, license_plate, type } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO vehicles (name, license_plate, type) VALUES ($1, $2, $3) RETURNING *", [name, license_plate, type]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Alle Fahrzeuge abrufen
router.get("/", authMiddleware, async(req, res) => {
    try {
        const result = await pool.query("SELECT * FROM vehicles");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// 🔥 Hier ist deine PUT-Route
router.put("/:id", authMiddleware, checkRole(["admin"]), async(req, res) => {
    console.log("Request Params:", req.params);
    console.log("Request Body:", req.body);

    const { name, license_plate, type } = req.body;
    const vehicleId = parseInt(req.params.id, 10);
    console.log('vechiled ', vehicleId);


    try {
        const result = await pool.query(
            "UPDATE vehicles SET name = $1, license_plate = $2, type = $3 WHERE id = $4 RETURNING *", [name, license_plate, type, vehicleId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Update Fehler:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});


// Fahrzeugschäden aktualisieren (nur Mechaniker)
router.put("/:id/damage", authMiddleware, checkRole(["admin"]), async(req, res) => {
    const { damages } = req.body;
    try {
        const result = await pool.query(
            "UPDATE vehicles SET damages = $1 WHERE id = $2 RETURNING *", [damages, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;