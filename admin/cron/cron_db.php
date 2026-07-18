<?php
// cron/cron_db.php — shared DB for cron scripts
if (!defined('CRON')) die('Direct access denied');

define('DB_HOST', 'localhost');
define('DB_NAME', 'suronkam_trustedspecs');
define('DB_USER', 'suronkam_ts');   // update
define('DB_PASS', 'your_db_pass');  // update

try {
    $pdo = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
} catch (PDOException $e) {
    die('DB Error: ' . $e->getMessage() . PHP_EOL);
}
