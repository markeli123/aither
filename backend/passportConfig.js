// passportConfig.js
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const axios = require("axios");
const db = require("./db");

// Serialize and deserialize for session support
passport.serializeUser((user, done) => {
  if (user && user.id) {
    done(null, user.id);
  } else {
    done(new Error("User object does not have an id"), null);
  }
});
passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

//-------- google strategy-------------
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/api/oauth/google/callback", // your ngrok URL
  scope: ["https://www.googleapis.com/auth/drive.metadata.readonly"],
  passReqToCallback: true,
  skipUserProfile: true // Skip fetching profile from Google
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
      // Parse the state parameter to get your app's user id.
      const state = req.query.state ? JSON.parse(req.query.state) : {};
      const appUserId = state.userId;
      if (!appUserId) {
          return done(new Error("User ID is missing in state"), null);
      }

      // Construct a simple user object using your app's user id.
      const userObject = {
          id: appUserId,  // Use your application's user id as the session identifier.
          accessToken: accessToken  // Save the access token for later API calls.
      };

    
      await db.query(
        `INSERT INTO services (user_id, service_name, oauth_token)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, service_name)
         DO UPDATE SET oauth_token = EXCLUDED.oauth_token`,
        [appUserId, 'google_drive', accessToken]
      );

      return done(null, userObject);
  } catch (error) {
      return done(error, null);
  }
}));

module.exports = passport;