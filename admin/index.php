<?php
session_start();

// ── Auth ──────────────────────────────────────────────────────────────────────
define('ADMIN_USER', 'admin');
define('ADMIN_PASS', 'ts@admin2025'); // ← change this

if (isset($_POST['login'])) {
    if ($_POST['u'] === ADMIN_USER && $_POST['p'] === ADMIN_PASS) {
        $_SESSION['ts_admin'] = true;
        header('Location: index.php');
        exit;
    }
    $login_error = 'Invalid credentials.';
}
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit;
}

$authed = !empty($_SESSION['ts_admin']);

// ── DB ────────────────────────────────────────────────────────────────────────
require_once __DIR__ . '/db.php';

if ($authed) {
    try {
        $pdo = ts_db();
    } catch (PDOException $e) {
        // Show DB error without leaking stack trace
        die('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>DB Error</title>'
           .'<style>body{font-family:sans-serif;padding:2rem;background:#f2f1ed}'
           .'.err{background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:1.5rem;color:#dc2626;max-width:600px}'
           .'</style></head><body>'
           .'<div class="err"><strong>Database connection failed.</strong><br><br>'
           . htmlspecialchars($e->getMessage())
           .'<br><br>Check your credentials in <code>db.php</code></div></body></html>');
    }
}

// ── Page routing ──────────────────────────────────────────────────────────────
$page  = $_GET['page'] ?? 'dashboard';
$valid = ['dashboard','products','product-edit','specs','quality','pricing','articles','article-edit',
          'alerts','clicks','news-fetcher','image-fetcher','settings','parameters','parameter-edit','phone-fetcher'];
if (!in_array($page, $valid)) $page = 'dashboard';

$page_titles = [
    'dashboard'    => 'Dashboard',
    'products'     => 'Products',
    'product-edit' => 'Edit Product',
    'specs'        => 'Specs Editor',
    'quality'      => 'Quality Scores',
    'pricing'      => 'Pricing',
    'articles'     => 'Articles',
    'article-edit' => 'Edit Article',
    'alerts'       => 'Price Alerts',
    'clicks'       => 'Affiliate Clicks',
    'news-fetcher' => 'News Fetcher',
    'image-fetcher'=> 'Image Fetcher',
    'settings'     => 'Settings',
    'parameters'   => 'Parameters',
    'parameter-edit'=> 'Edit Parameter',
    'phone-fetcher' => 'Phone Fetcher',
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TrustedSpecs Admin — <?= htmlspecialchars($page_titles[$page] ?? 'Admin') ?></title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/admin.css">
</head>
<body class="<?= $authed ? 'is-authed' : 'is-login' ?>">

<?php if (!$authed): ?>
<!-- ── LOGIN ───────────────────────────────────────────────────────────────── -->
<div class="login-wrap">
  <div class="login-card">
    <div class="login-logo">
      <span class="logo-mark">TS</span>
      <span class="logo-text">TrustedSpecs <em>Admin</em></span>
    </div>
    <?php if (!empty($login_error)): ?>
      <div class="alert alert-error"><?= htmlspecialchars($login_error) ?></div>
    <?php endif; ?>
    <form method="POST" action="index.php">
      <div class="field">
        <label for="u">Username</label>
        <input id="u" name="u" type="text" autocomplete="username" required>
      </div>
      <div class="field">
        <label for="p">Password</label>
        <input id="p" name="p" type="password" autocomplete="current-password" required>
      </div>
      <button type="submit" name="login" class="btn btn-primary btn-full">Sign in</button>
    </form>
  </div>
</div>

<?php else: ?>
<!-- ── APP SHELL ───────────────────────────────────────────────────────────── -->
<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <span class="logo-mark">TS</span>
    <span class="logo-text">TrustedSpecs</span>
    <button class="sidebar-close" id="sidebarClose" aria-label="Close menu">✕</button>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-group">
      <span class="nav-label">Overview</span>
      <a href="index.php?page=dashboard" class="nav-link <?= $page==='dashboard'?'active':'' ?>">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>
        Dashboard
      </a>
    </div>
    <div class="nav-group">
      <span class="nav-label">Catalogue</span>
      <a href="index.php?page=products" class="nav-link <?= $page==='products'||$page==='product-edit'?'active':'' ?>">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 10h6M10 7v6"/></svg>
        Products
      </a>
      <a href="index.php?page=articles" class="nav-link <?= $page==='articles'||$page==='article-edit'?'active':'' ?>">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M6 7h8M6 10h8M6 13h5"/></svg>
        Articles
      </a>
      <a href="index.php?page=parameters" class="nav-link <?= $page==='parameters'||$page==='parameter-edit'?'active':'' ?>">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h12M4 10h8M4 14h10"/><circle cx="16" cy="14" r="2"/></svg>
        Parameters
      </a>
    </div>
    <div class="nav-group">
      <span class="nav-label">Data</span>
      <a href="index.php?page=pricing" class="nav-link <?= $page==='pricing'?'active':'' ?>">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><path d="M10 6v8M8 8h3a1 1 0 010 2H9a1 1 0 000 2h3"/></svg>
        Pricing
      </a>
      <a href="index.php?page=alerts" class="nav-link <?= $page==='alerts'?'active':'' ?>">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 2a6 6 0 00-6 6v3l-1 2h14l-1-2V8a6 6 0 00-6-6zM9 16h2a1 1 0 01-2 0z"/></svg>
        Price Alerts
      </a>
      <a href="index.php?page=clicks" class="nav-link <?= $page==='clicks'?'active':'' ?>">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 15l4-7 3 4 2-3 4 6H4z"/></svg>
        Clicks
      </a>
    </div>
    <div class="nav-group">
      <span class="nav-label">Tools</span>
      <a href="index.php?page=phone-fetcher" class="nav-link <?= $page==='phone-fetcher'?'active':'' ?>">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="2" width="8" height="16" rx="2"/><path d="M9 15h2"/></svg>
        Phone Fetcher
      </a>
      <a href="index.php?page=news-fetcher" class="nav-link <?= $page==='news-fetcher'?'active':'' ?>">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h14v2H3zm0 4h14v2H3zm0 4h9v2H3z"/></svg>
        News Fetcher
      </a>
      <a href="index.php?page=image-fetcher" class="nav-link <?= $page==='image-fetcher'?'active':'' ?>">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="14" height="10" rx="2"/><circle cx="7.5" cy="9" r="1.5"/><path d="M3 13l4-4 3 3 2-2 5 5"/></svg>
        Image Fetcher
      </a>
      <a href="index.php?page=settings" class="nav-link <?= $page==='settings'?'active':'' ?>">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="2.5"/><path d="M10 3v1.5M10 15.5V17M3 10h1.5M15.5 10H17M5.1 5.1l1 1M13.9 13.9l1 1M14.9 5.1l-1 1M6.1 13.9l-1 1"/></svg>
        Settings
      </a>
    </div>
  </nav>
  <div class="sidebar-footer">
    <a href="index.php?logout=1" class="nav-link nav-link-logout">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 3h4v14h-4M8 13l-3-3 3-3M5 10h8"/></svg>
      Sign out
    </a>
  </div>
</aside>

<div class="main-wrap">
  <header class="topbar">
    <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
    <h1 class="topbar-title"><?= htmlspecialchars($page_titles[$page] ?? '') ?></h1>
    <div class="topbar-right">
      <a href="https://trustedspecs.com" target="_blank" class="topbar-site">↗ View site</a>
    </div>
  </header>

  <main class="content" id="main-content">
    <?php
    $page_file = __DIR__ . '/pages/' . $page . '.php';
    if (file_exists($page_file)) {
        include $page_file;
    } else {
        echo '<div class="alert alert-error">Page not found: ' . htmlspecialchars($page) . '</div>';
    }
    ?>
  </main>
</div>

<div class="overlay" id="overlay"></div>

<?php endif; ?>

<script src="js/admin.js"></script>
<?php if ($authed && in_array($page, ['product-edit','quality'])): ?>
<script src="js/products.js"></script>
<?php endif; ?>
<?php if ($authed && $page === 'specs'): ?>
<script src="js/specs.js"></script>
<?php endif; ?>
<?php if ($authed && in_array($page, ['articles','article-edit'])): ?>
<script src="js/articles.js"></script>
<?php endif; ?>
<?php if ($authed && $page === 'image-fetcher'): ?>
<script src="js/image-fetcher.js"></script>
<?php endif; ?>
</body>
</html>
