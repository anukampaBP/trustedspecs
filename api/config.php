<?php
// ================================================================
// TrustedSpecs — API Config
// Rename this to config.php and fill in your DB credentials
// ================================================================

// ── Database ─────────────────────────────────────────────────────
define('DB_HOST',    'localhost');
define('DB_NAME',    'suronkam_trustedspecs'); // your cPanel DB name
define('DB_USER',    'your_db_user');          // your cPanel DB user
define('DB_PASS',    'your_db_password');      // your cPanel DB password
define('DB_CHARSET', 'utf8mb4');

// ── CORS: allowed frontend origins ───────────────────────────────
// Add your Cloudflare Pages URL and your live domain
define('ALLOWED_ORIGINS', [
    'https://trustedspecs.com',
    'https://www.trustedspecs.com',
    'https://trustedspecs.pages.dev',   // Cloudflare Pages preview URL
    'http://localhost:5173',             // Vite local dev
    'http://localhost:3000',             // CRA local dev
]);

// ── App settings ─────────────────────────────────────────────────
define('API_VERSION',    '1.0');
define('MAX_PAGE_SIZE',  50);
define('CACHE_SHORT',    300);   // 5 minutes
define('CACHE_MEDIUM',   1800);  // 30 minutes
define('CACHE_LONG',     86400); // 24 hours
define('MYSTERY_SALT',   'ts_mystery_2026'); // change this to anything unique
