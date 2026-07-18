<?php
// pages/alerts.php
$alerts = [];
try {
    $alerts = $pdo->query(
        'SELECT pa.*, p.name as product_name, p.brand
         FROM price_alerts pa JOIN product p ON p.id=pa.product_id
         ORDER BY pa.created_at DESC LIMIT 100'
    )->fetchAll();
} catch (Exception $e) {
    $alerts = [];
}
$total = count($alerts);
$triggered = count(array_filter($alerts, fn($a) => $a['triggered']));
?>
<div class="stats-grid mb-3">
  <div class="stat-card"><div class="stat-label">Total Alerts</div><div class="stat-value"><?= $total ?></div></div>
  <div class="stat-card"><div class="stat-label">Triggered</div><div class="stat-value"><?= $triggered ?></div></div>
  <div class="stat-card"><div class="stat-label">Active</div><div class="stat-value"><?= $total - $triggered ?></div></div>
</div>
<div class="card card-body-flush">
  <div class="table-wrap">
    <table>
      <thead><tr><th>Phone</th><th>Email</th><th>Target Price</th><th>Tier</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>
      <?php if (empty($alerts)): ?>
        <tr><td colspan="6"><div class="empty-state">No price alerts yet.</div></td></tr>
      <?php else: ?>
      <?php foreach ($alerts as $a): ?>
        <tr>
          <td><?= htmlspecialchars($a['product_name']) ?><div class="text-xs text-muted"><?= htmlspecialchars($a['brand']) ?></div></td>
          <td class="mono text-sm"><?= htmlspecialchars($a['email'] ?? '—') ?></td>
          <td class="mono">₹<?= number_format($a['target_price']) ?></td>
          <td><span class="badge <?= $a['tier']==='pro'?'badge-purple':'badge-gray' ?>"><?= htmlspecialchars($a['tier'] ?? 'free') ?></span></td>
          <td><?= $a['triggered'] ? '<span class="badge badge-green">Sent</span>' : '<span class="badge badge-amber">Waiting</span>' ?></td>
          <td class="text-sm text-muted"><?= date('d M Y', strtotime($a['created_at'])) ?></td>
        </tr>
      <?php endforeach; ?>
      <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>
