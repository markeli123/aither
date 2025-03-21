// authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const router = express.Router();

/* -------------------------
   User Registration Route
-------------------------- */
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user already exists
    const userExists = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const newUser = await db.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------
   User Login Route
-------------------------- */
router.post("/login", async (req, res) => {
  //console.log("entered login from back heheheheheheh ");
  const { email, password } = req.body;

  try {
    // 1. Fetch the user from DB
    const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }
    const user = userResult.rows[0];

    // 2. Validate the password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // 3. Generate a JWT token (expires in 1 hour)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: 3600 })

    // 5. Return JSON with the token (optional)
    return res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* -------------------------
   Protected Route: Get Current User Info
-------------------------- */
function authenticateToken(req, res, next) {
  
  const authHeader = req.headers.authorization; // Expecting "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await db.query("SELECT id, email FROM users WHERE id = $1", [req.user.id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
