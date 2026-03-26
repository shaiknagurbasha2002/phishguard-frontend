# PhishGuard PHP API

Backend for the React frontend. Copy this folder to your XAMPP htdocs so the API is available at `http://localhost/phishguard-api/api/`.

## Setup (XAMPP at E:\xxamp)

1. Copy the entire `phishguard-api` folder to:
   ```
   E:\xxamp\htdocs\phishguard-api\
   ```
2. Ensure MySQL is running and the `phishguard` database exists (with `users` and `points_ledger` tables from the main PhishGuard schema).
3. In `api/db.php`, credentials are set to:
   - Database: `phishguard`
   - User: `root`
   - Password: (empty)

## Endpoints

| File          | URL                                  | Description                    |
|---------------|--------------------------------------|--------------------------------|
| ping.php      | GET /phishguard-api/api/ping.php     | Health check                   |
| users.php     | GET /phishguard-api/api/users.php    | List users (id, full_name, email) |
| leaderboard.php | GET /phishguard-api/api/leaderboard.php | Top 50 by total points    |

## CORS

Allowed origin: `http://localhost:5173` (Vite dev server).  
Methods: GET, POST, OPTIONS.  
Headers: Content-Type, Authorization.  
Credentials: true.
