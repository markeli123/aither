// oauth.js
const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const db = require("./db");
const axios = require("axios");

const router = express.Router();

/**
 * Middleware to authenticate requests by extracting the JWT from the Authorization header.
 * Expected header format: "Authorization: Bearer <token>"
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

/**
 * Google OAuth Initiation Route.
 * Expects a "state" parameter in the query string (JSON stringified, containing the userId).
 * Example: /api/oauth/google?state={"userId":1}
 */
router.get("/google", (req, res, next) => {
  if (!req.query.state) {
    return res.status(400).send("State parameter required");
  }
  let state;
  try {
    state = JSON.parse(req.query.state);
  } catch (error) {
    return res.status(400).send("Invalid state parameter");
  }
  const userId = state.userId;
  if (!userId) return res.status(400).send("User id required");

  console.log("Initiating Google OAuth for user id:", userId);
  passport.authenticate("google", { state: req.query.state })(req, res, next);
});

/**
 * Google OAuth Callback Route.
 * On successful authentication, redirects the user back to your frontend dashboard.
 */
router.get("/google/callback", 
  passport.authenticate("google", { failureRedirect: "/api/oauth/failure" }),
  (req, res) => {
    console.log("Google OAuth callback successful");
    res.redirect("http://localhost:3000/dashboard?service=google");
  }
);

/**
 * OAuth Failure Route.
 */
router.get("/failure", (req, res) => {
  res.send("OAuth failed");
});

/**
 * Files Endpoint.
 * This endpoint retrieves the Google Drive OAuth token from your database for the authenticated user,
 * and then uses the googleapis library to list the first 10 files in the user's Drive.
 */
router.get("/files", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Retrieve the Google Drive OAuth token from your services table
    const result = await db.query(
      "SELECT oauth_token FROM services WHERE user_id = $1 AND service_name = 'google_drive'",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ 
        status: "error",
        message: "Google Drive not connected" 
      });
    }
    const googleToken = result.rows[0].oauth_token;

    // Initialize the OAuth2 client with the retrieved access token
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: googleToken });
    const drive = google.drive({ version: "v3", auth });
    const response = await drive.files.list({
      pageSize: 10, // Adjust the number of files as needed
      fields: "files(id, name, mimeType)",
    });
    
    // Format the file data into a clean structure
    const formattedFiles = response.data.files.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.mimeType,
    }));

    res.status(200).json({
      status: "success",
      message: "Google Drive files retrieved successfully",
      data: {
        files: formattedFiles,
      },
    });
  } catch (error) {
    console.error("Error fetching Google Drive files:", error.response?.data || error.message);
    res.status(500).json({ 
      status: "error",
      message: error.message 
    });
  }
});


module.exports = router;
