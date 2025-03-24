# **Project Setup Guide**

## **Table of Contents**

1. [Prerequisites](#prerequisites)
2. [Setting Up PostgreSQL](#setting-up-postgresql)
3. [Setting Up Google Client](#setting-up-google-client)
4. [Inserting Keys into `.env`](#inserting-keys-into-env)
5. [Creating PostgreSQL Tables](#creating-postgresql-tables)
6. [Running the Project](#running-the-project)
7. [Environment Configuration](#environment-configuration)
8. [Requirements](#requirements)
9. [Additional Setup](#additional-setup)

---

## **Prerequisites**

Before getting started, make sure you have the following installed:

1. **Node.js** (Recommended version: v16 or higher)  
   Install from [Node.js](https://nodejs.org/).

2. **PostgreSQL**  
   Install PostgreSQL from [here](https://www.postgresql.org/download/).

3. **Google Developer Account**  
   Access the [Google Developer Console](https://console.developers.google.com/), as you'll need to create OAuth credentials.

---

## **Setting Up PostgreSQL**

1. **Install PostgreSQL**  
   If you don't have PostgreSQL installed, follow the installation instructions based on your OS:

   - For **macOS**:
     ```bash
     brew install postgresql
     ```

   - For **Windows**: Download the installer from the official [PostgreSQL site](https://www.postgresql.org/download/windows/).

   - For **Linux**:
     ```bash
     sudo apt update
     sudo apt install postgresql postgresql-contrib
     ```

2. **Create Database and User**  
   After installing PostgreSQL, create a new database and user:

   ```bash
   sudo -u postgres psql
   ```

   In the PostgreSQL shell, run:
   ```sql
   CREATE DATABASE your_database_name;
   CREATE USER your_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_user;
   \q
   ```

3. **Configure PostgreSQL in Your Application**  
   In your project’s `.env` file, add the PostgreSQL connection details:
   ```bash
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_user
   DB_PASSWORD=your_password
   ```

4. **Migrate the Database (if applicable)**  
   Run any migrations to set up the database schema. Depending on the tool you're using, this could be a command like:
   ```bash
   npm run migrate
   ```

---

## **Setting Up Google Client**

1. **Create a Project in Google Developer Console**  
   Go to the [Google Developer Console](https://console.developers.google.com/), create a new project, and enable the **Google Drive API**.

2. **Create OAuth 2.0 Credentials**  
   - Under **APIs & Services > Credentials**, click **Create Credentials** and select **OAuth 2.0 Client IDs**.
   - Choose **Web application** as the application type.
   - Under **Authorized redirect URIs**, add the following:
     ```
     http://localhost:5000/api/oauth/google/callback
     ```

3. **Download Client Secret**  
   Once the OAuth client ID is created, click **Download** to save the JSON file containing your **Client ID** and **Client Secret**.

---

## **Inserting Keys into `.env`**

1. **Generate OAuth Client ID & Secret**  
   Open the **credentials.json** file downloaded from Google Developer Console and extract the following information:
   - **Client ID** (from `client_id` field)
   - **Client Secret** (from `client_secret` field)

2. **Insert the Keys into `.env`**  
   Create a `.env` file at the root of your project and add the following:
   ```bash
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/oauth/google/callback
   ```

3. **Google OAuth Setup**  
   In your backend code, ensure that the `google-auth-library` is correctly configured with the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` values from your `.env`.

   Example in your backend (e.g., `oauth.js`):
   ```js
   const { OAuth2Client } = require('google-auth-library');
   const client = new OAuth2Client(
     process.env.GOOGLE_CLIENT_ID,
     process.env.GOOGLE_CLIENT_SECRET,
     process.env.GOOGLE_REDIRECT_URI
   );
   ```

---

## **Creating PostgreSQL Tables**

You need two tables: `users` and `services`. Below is the SQL code for creating these tables.

1. **Login Table (`users`)**  
   Create a table called `users` to store user information such as `id`, `email`, and `password`.

   ```sql
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL
   );
   ```

2. **Service Table (`services`)**  
   Create a table called `services` to store service-related information, such as the `user_id` (foreign key from the `users` table), `service_name` (e.g., Google Drive), and `oauth_token` for the connected service.

   ```sql
   CREATE TABLE services (
     id SERIAL PRIMARY KEY,
     user_id INT REFERENCES users(id) ON DELETE CASCADE,
     service_name VARCHAR(255) NOT NULL,
     oauth_token TEXT NOT NULL
   );
   ```

3. **Populating the Tables**  
   Insert some sample data into the `users` and `services` tables:
   
   - Inserting into the `users` table:
     ```sql
     INSERT INTO users (email, password) VALUES ('test@example.com', 'hashed_password');
     ```
   
   - Inserting into the `services` table:
     ```sql
     INSERT INTO services (user_id, service_name, oauth_token) 
     VALUES (1, 'google_drive', 'sample_oauth_token');
     ```

---

## **Running the Project**

1. **Install Dependencies**  
   Install all required packages by running:
   ```bash
   npm install
   ```

2. **Start the Backend Server**  
   Start the backend server on port `5000`:
   ```bash
   npm run dev
   ```

3. **Start the Frontend React App**  
   In a separate terminal, navigate to the frontend folder (if you have a separate one) and run:
   ```bash
   npm start
   ```

4. **Visit Your Application**  
   Open a browser and go to `http://localhost:3000` to view your app.

---

## **Environment Configuration**

Here’s a list of all the environment variables that should be in your `.env` file:

```bash
# Port for backend server
PORT=5000

# PostgreSQL Database Connection
DATABASE_URL=postgres://username:password@localhost:PORT/DB_NAME

# JWT Secret for signing tokens
JWT_SECRET=your_random_secret_key_here

# Session Secret for session handling
SESSION_SECRET=your_random_session_secret_key_here

# OAuth Credentials for Slack
SLACK_CLIENT_ID=your_slack_client_id_here
SLACK_CLIENT_SECRET=your_slack_client_secret_here

# OAuth Credentials for Google
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/oauth/google/callback
```

---

## **Requirements**

### `requirements.txt` for Python (if applicable):
If you are using Python, here is an example of `requirements.txt`:
```txt
express
pg
dotenv
passport
passport-google-oauth20
bcryptjs
jsonwebtoken
axios
cors
express-session
```

For **Node.js** projects, dependencies will be in the `package.json` file.

---

## **Additional Setup**

1. **API Rate Limiting**  
   - If your app is interacting with external APIs like Google Drive, ensure that you have implemented rate-limiting or API request throttling to avoid hitting quota limits.

2. **Security Considerations**  
   - Make sure to keep your **.env** file secure and do not expose it publicly.
   - Consider using environment-specific configurations for different deployment environments (development, staging, production).

3. **Test OAuth Flow**  
   - After everything is set up, test the OAuth flow by clicking the "Connect to Google Drive" button and ensuring the app redirects and fetches files successfully.

4. **Deploying the Application**  
   - When deploying to a production environment, make sure to update the redirect URI in your Google Developer Console to match your production URL (e.g., `https://yourdomain.com/api/oauth/google/callback`).

---

## **Conclusion**

With these steps, you should have a fully functioning local development environment for your project that integrates with PostgreSQL and Google Drive. The `.env` configuration, OAuth setup, and database configuration are key steps to make sure your application works seamlessly.

Let me know if you need further clarification on any of the steps or need help with anything else!

---

The only change is the **removal of cookie-parser** and its references throughout the README. Let me know if you want this change in the text file!