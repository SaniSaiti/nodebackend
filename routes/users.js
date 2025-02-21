const express = require("express");
const pool = require("../db");
const { authMiddleware, checkRole, checkOwnUser } = require("../middleware/auth");

const router = express.Router();

// Alle Users abrufen
router.get("/", authMiddleware, async(req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/:id", authMiddleware, checkRole(["admin"]), async(req, res) => {
    const userId = req.params.id;
    const updatedFields = req.body;

    // Falls keine Daten gesendet wurden
    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ error: "No fields provided to update" });
    }

    const updateKeys = [];
    const updateValues = [];
    let index = 1;

    for (const key in updatedFields) {
        if (updatedFields[key] !== undefined && updatedFields[key] !== null) {
            updateKeys.push(`${key} = $${index++}`);
            updateValues.push(updatedFields[key]);
        }
    }

    if (updateKeys.length === 0) {
        return res.status(400).json({ error: "No valid fields provided" });
    }

    // Die ID zum Update hinzufügen
    updateValues.push(userId);

    const sqlQuery = `
        UPDATE users
        SET ${updateKeys.join(", ")}
        WHERE id = $${index}
        RETURNING *`;

    try {
        const result = await pool.query(sqlQuery, updateValues);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Geolocation user nur von dem eingelogten User updadaten 
router.put("/:id/location", authMiddleware, checkOwnUser(), async(req, res) => {
    console.log("Request Params:", req.params);
    console.log("Request Body:", req.body);

    const lastposition = req.body;
    const userId = parseInt(req.params.id, 10); // Hier die ID aus den URL-Parametern

    console.log(' userId:', userId);
    console.log('lastposition ', lastposition);

    try {
        const result = await pool.query(
            `UPDATE users
            SET lastposition = $1
            WHERE id = $2 RETURNING *`, [JSON.stringify(lastposition), userId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Update Fehler:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

// Geolocation von allen Users
router.get("/locations", authMiddleware, async(req, res) => {
    try {
        const result = await pool.query("SELECT lastposition, id FROM users WHERE lastposition IS NOT NULL");
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User löschen
router.delete("/:id", authMiddleware, checkRole(["admin"]), async(req, res) => {
    const userId = req.params.id;

    try {
        const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [userId]);

        if (result.rows.length > 0) {
            res.json({ message: "User deleted successfully", user: result.rows[0] });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;