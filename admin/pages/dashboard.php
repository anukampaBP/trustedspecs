<?php
// pages/dashboard.php
$stats = [
    'total_phones'   => $pdo->query("SELECT COUNT(*) FROM product")->fetchColumn(),
    'live_phones'    => $pdo->query("SELECT COUNT(*) FROM product WHERE status=1")->fetchColumn(),
    'draft_phones'   => $pdo->query("SELECT COUNT(*) FROM product WHERE status=0")->fetchColumn(),
    'total_articles' => $pdo->query("SELECT COUNT(*) FROM articles")->fetchColumn() ?? 0,
    'live_articles'  => $pdo->query("SELECT COUNT(*) FROM articles WHERE status='published'")->fetchColumn() ?? 0,
    'total_alerts'   => $pdo->query("SELECT COUNT(*) FROM price_alerts")->fetchColumn() ?? 0,
    'phones_no_score'=> $pdo->query("SELECT COUNT(*) FROM product p WHERE NOT EXISTS (SELECT 1 FROM scores s WHERE s.product_id=p.id)")->fetchColumn(),
    'phones_no_price'=> $pdo->query("SELECT COUNT(*) FROM product p WHERE NOT EXISTS (SELECT 1 FROM pricing pr WHERE pr.product_id=p.id)")->fetchColumn(),
];

// 5 most recently added phones
$recent_phones = $pdo->query(
    "SELECT id,name,brand,status,created_at FROM product ORDER BY id DESC LIMIT 5"
)->fetchAll();

// Pending issues
$issues = [];
if ($stats['draft_phones'] > 0) $issues[] = $stats['draft_phones'] . ' phones in draft (not live)';
if ($stats['phones_no_score'] > 0) $issues[] = $stats['phones_no_score'] . ' phones with no quality score';
if ($stats['phones_no_price'] > 0) $issues[] = $stats['phones_no_price'] . ' phones with no price data';
?>

<div class="stats-grid">
  <div class="stat-card stat-accent">
    <div class="stat-label">Total Phones</div>
    <div class="stat-value"><?= $stats['total_phones'] ?></div>
    <div class="stat-sub"><?= $stats['live_phones'] ?> live · <?= $stats['draft_phones'] ?> draft</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Articles</div>
    <div class="stat-value"><?= $stats['total_articles'] ?></div>
    <div class="stat-sub"><?= $stats['live_articles'] ?> published</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Price Alerts</div>
    <div class="stat-value"><?= $stats['total_alerts'] ?></div>
    <div class="stat-sub">Active subscriptions</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Missing Scores</div>
    <div class="stat-value" style="color:<?= $stats['phones_no_score']>0?'var(--amber)':'var(--green)' ?>">
      <?= $stats['phones_no_score'] ?>
    </div>
    <div class="stat-sub">Need quality review</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Missing Prices</div>
    <div class="stat-value" style="color:<?= $stats['phones_no_price']>0?'var(--amber)':'var(--green)' ?>">
      <?= $stats['phones_no_price'] ?>
    </div>
    <div class="stat-sub">No price data</div>
  </div>
</div>

<?php if (!empty($issues)): ?>
<div class="alert alert-warn mb-2">
  <div>
    <strong>Action needed:</strong>
    <ul style="margin:.35rem 0 0 1rem">
      <?php foreach ($issues as $issue): ?>
        <li><?= htmlspecialchars($issue) ?></li>
      <?php endforeach; ?>
    </ul>
  </div>
</div>
<?php endif; ?>

<div class="grid-2" style="gap:1.5rem">
  <div class="card">
    <div class="card-header">
      <h2>Recently Added Phones</h2>
      <a href="index.php?page=products" class="btn btn-sm btn-secondary">All phones</a>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Brand</th><th>Status</th></tr></thead>
        <tbody>
        <?php foreach ($recent_phones as $p): ?>
          <tr>
            <td><a href="index.php?page=product-edit&id=<?= $p['id'] ?>"><?= htmlspecialchars($p['name']) ?></a></td>
            <td class="text-sm text-muted"><?= htmlspecialchars($p['brand']) ?></td>
            <td><?= $p['status'] ? '<span class="badge badge-green">Live</span>' : '<span class="badge badge-amber">Draft</span>' ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><h2>Quick Actions</h2></div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:.6rem">
      <a href="index.php?page=product-edit" class="btn btn-primary">+ Add New Phone</a>
      <a href="index.php?page=article-edit" class="btn btn-secondary">+ Write Article</a>
      <a href="index.php?page=news-fetcher" class="btn btn-secondary">📡 Fetch News</a>
      <a href="index.php?page=image-fetcher" class="btn btn-secondary">🖼 Find Phone Images</a>
      <a href="index.php?page=pricing" class="btn btn-secondary">💰 View All Prices</a>
    </div>
  </div>
</div>
