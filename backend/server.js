// server.js
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();

// Import routes and passport configuration
const authRoutes = require("./authRoutes");
const oauthRoutes = require("./oauth");
require("./passportConfig");

const app = express();

// Parse JSON bodies
app.use(express.json());


// Configure CORS to allow requests from your frontend and send credentials
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// Use session middleware (if needed)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));