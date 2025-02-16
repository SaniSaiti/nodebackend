const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { authMiddleware, checkRole } = require("../middleware/auth");

const router = express.Router();

// Registrierung
router.post("/register", authMiddleware, checkRole(["admin"]), async(req, res) => {
    console.log('rqe.body', req.body);

    const {
        vorname,
        nachname,
        email,
        telefonnummer,
        geburtsdatum,
        adresse,
        wohnort,
        staplerschein,
        lehrfahrausweisGueltigkeit,
        role,
        fuehrerscheinKlasse,
        czv,
        czvGueltigkeit
    } = req.body;

    // Standardpasswort setzen, falls kein Passwort übergeben wurde.
    const password = '123456'; // Das Standardpasswort
    console.log('req.user.role ', req.user.role);

    try {
        // Das Passwort hashen
        const hashedPassword = await bcrypt.hash(password, 10);

        // Benutzer in der Datenbank speichern
        const newUser = await pool.query(
            "INSERT INTO users (vorname, nachname, email, telefonnummer, geburtsdatum, adresse, wohnort, staplerschein, lehrfahrausweisGueltigkeit, role, fuehrerscheinKlasse, czv, czvGueltigkeit, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *", [
                vorname, nachname, email, telefonnummer, geburtsdatum, adresse, wohnort,
                staplerschein, lehrfahrausweisGueltigkeit, role, fuehrerscheinKlasse, czv, czvGueltigkeit, hashedPassword
            ]
        );

        res.json(newUser.rows[0]); // Gibt den neu erstellten Benutzer zurück.
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Login
router.post("/login", async(req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        console.log('user ', user);

        if (user.rows.length === 0) return res.status(400).json({ error: "User nicht gefunden" });

        const validPass = await bcrypt.compare(password, user.rows[0].password);
        console.log('valindPass ', validPass);

        if (!validPass) return res.status(400).json({ error: "Falsches Passwort" });

        const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, process.env.JWT_SECRET);
        res.json({ token, user: user.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;