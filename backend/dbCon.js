import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const router = express.Router();

/* ================================
   Datenbank-Verbindung
================================ */
const db = mysql.createPool({
    host: process.env.DB_HOST,      // db
    user: process.env.DB_USER,      // appuser
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,  // appdb
    waitForConnections: true,
    connectionLimit: 10
});

/* ================================
   Tabelle sicherstellen (optional)
================================ */
async function initDB() {
    await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE
    )
  `);
    console.log("Users-Tabelle bereit");
}

initDB();

/* ================================
   USER ANLEGEN (POST)
================================ */
router.post("/users", async (req, res) => {
    try {
        const { name, password, email } = req.body;

        if (!name || !password || !email) {
            return res.status(400).json({ error: "Alle Felder sind Pflicht" });
        }

        // Passwort hashen
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            "INSERT INTO users (name, password, email) VALUES (?, ?, ?)",
            [name, hashedPassword, email]
        );

        res.status(201).json({
            message: "User erstellt",
            id: result.insertId
        });

    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "E-Mail existiert bereits" });
        }
        res.status(500).json({ error: "Serverfehler" });
    }
});

/* ================================
   USER ABFRAGEN (GET)
================================ */
router.get("/users", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, name, email FROM users"
        );

        res.json(rows);

    } catch (err) {
        res.status(500).json({ error: "Serverfehler" });
    }
});

/* ================================
   LOGIN (POST)
================================ */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await db.execute(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Ungültige Zugangsdaten" });
        }

        const user = rows[0];

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: "Ungültige Zugangsdaten" });
        }

        res.json({
            message: "Login erfolgreich",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        res.status(500).json({ error: "Serverfehler" });
    }
});

export default router;

/* Ungetestet
User anlegen: curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Justus","password":"1234","email":"justus@test.de"}'
alle User holen: curl http://localhost:3000/api/users
Login: curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"justus@test.de","password":"1234"}' */