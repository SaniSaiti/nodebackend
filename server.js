require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Transport Management System API läuft 🚀");
});

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const calculateworktimeRoutes = require("./routes/calculateworktime");
app.use("/api/calculateworktime", calculateworktimeRoutes);

const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

const worklogRoutes = require("./routes/worklog");
app.use("/api/worklogs", worklogRoutes);

const vehicleRoutes = require("./routes/vehicles");
app.use("/api/vehicles", vehicleRoutes);

const vehicledamageRoutes = require("./routes/vehicledamage");
app.use("/api/vehicledamage", vehicledamageRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));