const express = require('express');
const { DateTime } = require('luxon');
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();


const swissHolidays = [
    '2025-01-01', '2025-04-18', '2025-05-01',
    '2025-12-25', '2025-12-26'
];

const isHoliday = (date) => {
    return date && date.isValid && swissHolidays.includes(date.toISODate());
};

// API-Route zur Berechnung der Arbeitszeit
router.post('/', authMiddleware, (req, res) => {
    try {
        const { startTime, endTime } = req.body;

        console.log('Startzeit und Endzeit:', startTime, endTime);

        if (!startTime || !endTime) {
            return res.status(400).json({ error: 'Start- und Endzeit sind erforderlich' });
        }

        const start = DateTime.fromISO(startTime, { zone: 'Europe/Zurich' });
        const end = DateTime.fromISO(endTime, { zone: 'Europe/Zurich' });

        if (!start.isValid || !end.isValid) {
            return res.status(400).json({ error: 'Ungültiges Datum oder falsches Format' });
        }

        if (start >= end) {
            return res.status(400).json({ error: 'Startzeit muss vor der Endzeit liegen' });
        }

        let totalHours = 0;
        let nightHours = 0;
        let holidayHours = 0;

        let current = start;
        while (current < end) {
            let nextHour = current.plus({ hours: 1 });
            if (nextHour > end) nextHour = end;

            const workedHours = nextHour.diff(current, 'hours').hours;

            // Prüfen: Nachtarbeit (22:00 - 06:00)
            if (current.hour >= 22 || current.hour < 6) {
                nightHours += workedHours;
            }

            // Prüfen: Feiertag
            if (isHoliday(current)) {
                holidayHours += workedHours;
            }

            totalHours += workedHours;
            current = nextHour;
        }

        res.json({ totalHours, nightHours, holidayHours });
    } catch (error) {
        console.error('Fehler bei der Berechnung:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

module.exports = router;