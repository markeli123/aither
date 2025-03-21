// db.js
const { Pool } = require("pg");
require("dotenv").config();
//console.log("entered db");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
