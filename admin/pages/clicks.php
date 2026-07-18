<?php
// pages/clicks.php
$period = intval($_GET['days'] ?? 30);
$period = in_array($period,[7,14,30,60,90]) ? $period : 30;

$clicks = [];
try {
    $clicks = $pdo->prepare(
        'SELECT c.source, COUNT(*) as clicks, p.name as product_name, p.id as product_id, p.brand
         FROM affiliate_clicks c JOIN product p ON p.id=c.product_id
         WHERE c.clicked_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
         GROUP BY c.product_id, c.source
         ORDER BY clicks DESC LIMIT 100'
    );
    $clicks->execute([':days'=>$period]);
    $clicks = $clicks->fetchAll();
} catch (Exception $e) {
    $clicks = [];
}

$total_clicks = array_sum(array_column($clicks, 'clicks'));
?>
<div class="flex justify-between flex-center mb-3" style="flex-wrap:wrap;gap:1rem">
  <div>
    <strong><?= $total_clicks ?> clicks</strong>
    <span class="text-muted text-sm"> in the last <?= $period ?> days</span>
  </div>
  <div class="flex gap-1">
    <?php foreach ([7,14,30,60,90] as $d): ?>
      <a href="index.php?page=clicks&days=<?= $d ?>"
         class="btn btn-sm <?= $d===$period?'btn-primary':'btn-secondary' ?>"><?= $d ?>d</a>
    <?php endforeach; ?>
  </div>
</div>

<div class="card card-body-flush">
  <div class="table-wrap">
    <table>
      <thead><tr><th>Phone</th><th>Source</th><th>Clicks</th></tr></thead>
      <tbody>
      <?php if (empty($clicks)): ?>
        <tr><td colspan="3"><div class="empty-state">No click data yet.</div></td></tr>
      <?php else: ?>
      <?php foreach ($clicks as $c): ?>
        <tr>
          <td>
            <a href="index.php?page=product-edit&id=<?= $c['product_id'] ?>"><?= htmlspecialchars($c['product_name']) ?></a>
            <div class="text-xs text-muted"><?= htmlspecialchars($c['brand']) ?></div>
          </td>
          <td><span class="price-source-tag"><?= htmlspecialchars($c['source']) ?></span></td>
          <td class="mono" style="font-weight:600"><?= $c['clicks'] ?></td>
        </tr>
      <?php endforeach; ?>
      <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>
