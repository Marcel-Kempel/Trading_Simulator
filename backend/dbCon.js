import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

/**
 * User/Auth router.
 *
 * IMPORTANT:
 * - docker-compose does NOT wait for MariaDB to be "ready".
 * - if we crash on first connection attempt, the container will restart-loop.
 * So we connect with retries and only start serving DB-backed routes once ready.
 */

const router = express.Router();

function getDbConfig() {
  return {
    host: process.env.DB_HOST || "db",
    user: process.env.DB_USER || "appuser",
    password: process.env.DB_PASSWORD || "apppass",
    database: process.env.DB_NAME || "appdb",
    waitForConnections: true,
    connectionLimit: 10,
  };
}

const pool = mysql.createPool(getDbConfig());

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function waitForDbReady({ attempts = 30, delayMs = 1000 } = {}) {
  let lastError;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      lastError = err;
      console.warn(`DB not ready (attempt ${i}/${attempts}) -> ${err?.code || err?.message}`);
      await sleep(delayMs);
    }
  }
  throw lastError;
}

async function ensureSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE
    )
  `);
}

let dbReady = false;

// fire-and-forget init; routes check dbReady and return 503 until ready
(async () => {
  try {
    await waitForDbReady();
    await ensureSchema();
    dbReady = true;
    console.log("DB ready and schema ensured");
  } catch (err) {
    console.error("DB init failed (backend will keep running):", err?.message || err);
    dbReady = false;
  }
})();

function requireDb(_req, res, next) {
  if (!dbReady) {
    return res.status(503).json({ error: "db_not_ready" });
  }
  return next();
}

// small health endpoint for debugging
router.get("/db/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "UP" });
  } catch (err) {
    res.status(503).json({ status: "DOWN", error: err?.code || err?.message });
  }
});

/* USER ANLEGEN */
router.post("/users", requireDb, async (req, res) => {
  try {
    const { name, password, email } = req.body ?? {};

    if (!name || !password || !email) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const [result] = await pool.execute(
      "INSERT INTO users (name, password, email) VALUES (?, ?, ?)",
      [String(name), hashedPassword, String(email)]
    );

    return res.status(201).json({ message: "user_created", id: result.insertId });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "email_exists" });
    }
    console.error("POST /users failed:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

/* USER LISTE */
router.get("/users", requireDb, async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email FROM users ORDER BY id ASC");
    return res.json(rows);
  } catch (err) {
    console.error("GET /users failed:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

/* LOGIN */
router.post("/login", requireDb, async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const [rows] = await pool.execute(
      "SELECT id, name, email, password FROM users WHERE email = ?",
      [String(email)]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(String(password), String(user.password));
    if (!ok) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    return res.json({
      message: "login_ok",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("POST /login failed:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

export default router;
