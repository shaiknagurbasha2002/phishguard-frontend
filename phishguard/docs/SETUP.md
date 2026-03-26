# PhishGuard – Run in XAMPP

This guide gets the PHP/MySQL PhishGuard app running under XAMPP (Apache + PHP 8+ + MySQL).

## 1. Place the project

1. Copy or move the `phishguard` folder into your XAMPP document root:
   - **Windows:** `C:\xampp\htdocs\phishguard`
   - **Mac/Linux:** `/Applications/XAMPP/htdocs/phishguard` or `/opt/lampp/htdocs/phishguard`

2. The app is served from the **public** subfolder. You will use:
   - **Base URL:** `http://localhost/phishguard/public`

## 2. Create the database and import SQL

1. Start **XAMPP** and ensure **Apache** and **MySQL** are running.

2. Open **phpMyAdmin:**  
   `http://localhost/phpmyadmin`

3. Create a database named `phishguard` (Collation: `utf8mb4_unicode_ci`).

4. Import the schema:
   - Select the `phishguard` database.
   - Go to **Import**.
   - Choose file: `phishguard/sql/schema.sql`.
   - Click **Go**.

5. Import the seed data:
   - Again **Import**.
   - Choose file: `phishguard/sql/seed.sql`.
   - Click **Go**.

## 3. Configure the database

1. In the project, go to:  
   `phishguard/app/config/`

2. Copy the example local config:
   - Copy `config.local.php.example` to `config.local.php`.

3. Edit `config.local.php` and set your MySQL credentials, for example:

```php
<?php
return [
    'database' => [
        'host' => '127.0.0.1',
        'name' => 'phishguard',
        'user' => 'root',
        'pass' => '',   // default XAMPP MySQL password is empty
    ],
];
```

Save the file.

## 4. Default login credentials

After importing `seed.sql`, you can log in with:

| Role    | Email                     | Password  |
|--------|----------------------------|-----------|
| Admin  | `admin@phishguard.local`   | `password` |
| Student| `student@phishguard.local` | `password` |

**Optional – stronger passwords:** From the project root (`phishguard`), run:
```bash
php scripts/set_passwords.php
```
This sets `Admin123!` and `Student123!` for the admin and student accounts.

**Important:** Change these passwords before any production or shared use.

## 5. Open the app

1. In your browser go to:  
   **`http://localhost/phishguard/public`**

2. You should see the **login** page. Log in with one of the accounts above.

3. After login you’ll be on the **Dashboard**. Use the sidebar to open:
   - Training, Quiz, Email Scanner, Leaderboard, Simulation, Knowledge Hub, Report Incident, Security Tools.
   - **Admin Panel** is visible and accessible only when logged in as the admin user.

## 6. Test SSE stream and real-time features

- **SSE (Server-Sent Events):**  
  When you’re logged in and on a dashboard page, the client automatically opens the SSE connection to:
  - `http://localhost/phishguard/public/api/stream.php`  
  Events include notifications, recent activity, incident updates, leaderboard/scan updates. The UI updates in real time (e.g. notification count) without refreshing.

- **Fallback polling:**  
  If the browser doesn’t support or drops the SSE connection, the app falls back to polling:
  - `http://localhost/phishguard/public/api/poll.php`  
  It is called periodically (e.g. every 10 seconds) to fetch new notifications and activity.

- **Quick checks:**
  - Log in and watch the browser Network tab for a request to `stream.php` (type “eventsource” or “fetch” for the stream).
  - Create a notification (e.g. via admin or DB) for your user and confirm the count or list updates without reloading.
  - Trigger an action that creates activity (e.g. complete a lesson or quiz) and confirm the “Recent activity” section updates.

## 7. Troubleshooting

- **Blank page or 500 error:**  
  Enable PHP error display temporarily in `php.ini`:  
  `display_errors = On`  
  and check `C:\xampp\apache\logs\error.log` (or your XAMPP log path).

- **“Config not loaded” / database error:**  
  Ensure `app/config/config.local.php` exists and has the correct database name, user, and password.

- **Redirects or assets (CSS/JS) not loading:**  
  Use exactly:  
  `http://localhost/phishguard/public`  
  (with `/public`). If you use a different folder name (e.g. `PhishGuard`), replace `phishguard` in the URL with that folder name.

- **.htaccess not working (404 for all routes):**  
  In XAMPP, enable `mod_rewrite`:  
  In `httpd.conf`, ensure this line is uncommented:  
  `LoadModule rewrite_module modules/mod_rewrite.so`  
  and that `AllowOverride` is set to `All` for your document root. Then restart Apache.

- **SSE never connects:**  
  Some environments buffer output. If you see no events, check that `stream.php` sends `Content-Type: text/event-stream` and that no extra output (e.g. from another include) is sent before the stream. Polling will still work as a fallback.

## 8. Optional: Run from project root (alternative)

If you prefer to run the app so the URL is `http://localhost/phishguard` (without `/public`):

1. In XAMPP, set the document root for a virtual host to the **public** folder, e.g.:
   - Document root: `C:\xampp\htdocs\phishguard\public`
   - Then use: `http://localhost/phishguard` (or a hostname you set in `hosts` and in the vhost).

2. In that case, update `RewriteBase` in `phishguard/public/.htaccess` to match (e.g. `/` if the doc root is exactly `public`).

The rest of the setup (database, config, credentials, SSE/polling) stays the same.
