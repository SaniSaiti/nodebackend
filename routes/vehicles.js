const express = require("express");
const pool = require("../db");
const { authMiddleware, checkRole } = require("../middleware/auth");

const router = express.Router();

// Fahrzeug hinzufügen (nur Admin)
router.post("/", authMiddleware, checkRole(["admin"]), async(req, res) => {
    const { fahrzeugnummer, marke, modell, fahrzeugtyp, fahrzeugfarbe, kilometerstand, erstzulassung, maxzuladung, versicherunggueltigbis, fuehrerscheinklasse, mfkgueltigbis } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO vehicles (fahrzeugnummer, marke, modell, fahrzeugtyp, fahrzeugfarbe, kilometerstand, erstzulassung, maxzuladung, versicherunggueltigbis, fuehrerscheinklasse, mfkgueltigbis) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`, [fahrzeugnummer, marke, modell, fahrzeugtyp, fahrzeugfarbe, kilometerstand, erstzulassung, maxzuladung, versicherunggueltigbis, fuehrerscheinklasse, mfkgueltigbis]
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

// PUT Route für Fahrzeugaktualisierung (nur Admin)
router.put("/:id", authMiddleware, checkRole(["admin"]), async(req, res) => {
    console.log("Request Params:", req.params);
    console.log("Request Body:", req.body);

    const { fahrzeugnummer, marke, modell, fahrzeugtyp, fahrzeugfarbe, kilometerstand, erstzulassung, maxzuladung, versicherunggueltigbis, fuehrerscheinklasse, mfkgueltigbis } = req.body;
    const vehicleId = parseInt(req.params.id, 10); // Hier die ID aus den URL-Parametern
    console.log('Vehicle ID:', vehicleId);

    try {
        const result = await pool.query(
            `UPDATE vehicles
            SET id = $1, fahrzeugnummer = $2, marke = $3, modell = $4, fahrzeugtyp = $5, fahrzeugfarbe = $6, kilometerstand = $7, erstzulassung = $8, maxzuladung = $9, versicherunggueltigbis = $10, fuehrerscheinklasse = $11, mfkgueltigbis = $12
            WHERE id = $13 RETURNING *`, [vehicleId, fahrzeugnummer, marke, modell, fahrzeugtyp, fahrzeugfarbe, kilometerstand, erstzulassung, maxzuladung, versicherunggueltigbis, fuehrerscheinklasse, mfkgueltigbis, vehicleId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Update Fehler:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

// Fahrzeug löschen
router.delete("/:id", authMiddleware, checkRole(["admin"]), async(req, res) => {
    const vehicleId = req.params.id;

    try {
        const result = await pool.query("DELETE FROM vehicles WHERE id = $1 RETURNING *", [vehicleId]);

        if (result.rows.length > 0) {
            res.json({ message: "Fahrzeug erfolgreich gelöscht", vehicle: result.rows[0] });
        } else {
            res.status(404).json({ error: "Fahrzeug nicht gefunden" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
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