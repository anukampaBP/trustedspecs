<?php
// pages/products.php
$search = trim($_GET['search'] ?? '');
$status = $_GET['status'] ?? '';
$pg     = max(1, intval($_GET['pg'] ?? 1));
$per_page = 30;

$where  = ['1=1'];
$params = [];
if ($search !== '') {
    $where[]          = '(p.name LIKE :s OR p.brand LIKE :s2)';
    $params[':s']     = '%' . $search . '%';
    $params[':s2']    = '%' . $search . '%';
}
if ($status !== '') {
    $where[]        = 'p.status = :st';
    $params[':st']  = intval($status);
}
$where_sql = implode(' AND ', $where);

// Count
$count_stmt = $pdo->prepare("SELECT COUNT(*) FROM product p WHERE $where_sql");
$count_stmt->execute($params);
$total  = (int)$count_stmt->fetchColumn();
$pages  = max(1, ceil($total / $per_page));
$offset = ($pg - 1) * $per_page;

// Detect actual column names — never assume
$existing_cols = [];
foreach ($pdo->query("DESCRIBE product")->fetchAll() as $col) {
    $existing_cols[] = $col['Field'];
}
$has_launch_price = in_array('launch_price_inr', $existing_cols);
$has_primary_img  = in_array('primary_image_url', $existing_cols);
$has_discontinued = in_array('discontinued', $existing_cols);

$img_col   = $has_primary_img  ? 'p.primary_image_url as image' : 'NULL as image';
$price_col = $has_launch_price ? 'p.launch_price_inr'           : 'NULL as launch_price_inr';
$disc_col  = $has_discontinued ? 'p.discontinued'               : '0 as discontinued';

// specs FK column is 'product' (confirmed from DESCRIBE specs)
$spec_count_col = "(SELECT COUNT(*) FROM specs WHERE product = p.id) as spec_count";

$sql = "SELECT p.id, p.name, p.brand, p.slug, p.status,
               $disc_col, $price_col, $img_col,
               p.release_date,
               $spec_count_col
        FROM product p
        WHERE $where_sql
        ORDER BY p.id DESC
        LIMIT :limit OFFSET :offset";

$stmt = $pdo->prepare($sql);
foreach ($params as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':limit',  $per_page, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset,   PDO::PARAM_INT);
$stmt->execute();
$products = $stmt->fetchAll();

$total_phones = (int)$pdo->query("SELECT COUNT(*) FROM product")->fetchColumn();
$live_phones  = (int)$pdo->query("SELECT COUNT(*) FROM product WHERE status=1")->fetchColumn();
?>

<div class="flex justify-between flex-center mb-3" style="gap:1rem;flex-wrap:wrap">
  <div>
    <span class="text-muted text-sm"><?= $total_phones ?> total · </span>
    <span class="text-sm"><?= $live_phones ?> live</span>
  </div>
  <a href="index.php?page=product-edit" class="btn btn-primary">+ Add Phone</a>
</div>

<form method="GET" action="index.php" class="card mb-3" style="padding:1rem">
  <input type="hidden" name="page" value="products">
  <div class="flex gap-1" style="flex-wrap:wrap">
    <input type="search" name="search" placeholder="Search by name or brand…"
           value="<?= htmlspecialchars($search) ?>" style="flex:1;min-width:200px">
    <select name="status" style="width:140px">
      <option value="">All statuses</option>
      <option value="1" <?= $status==='1'?'selected':'' ?>>Live</option>
      <option value="0" <?= $status==='0'?'selected':'' ?>>Draft</option>
    </select>
    <button type="submit" class="btn btn-secondary">Filter</button>
    <?php if ($search || $status): ?>
      <a href="index.php?page=products" class="btn btn-secondary">Clear</a>
    <?php endif; ?>
  </div>
</form>

<div class="card card-body-flush">
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Phone</th>
          <th>Brand</th>
          <?php if ($has_launch_price): ?><th>Launch Price</th><?php endif; ?>
          <th>Release</th>
          <th>Specs</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($products)): ?>
        <tr><td colspan="7">
          <div class="empty-state">No phones found.</div>
        </td></tr>
        <?php else: ?>
        <?php foreach ($products as $p): ?>
        <tr>
          <td>
            <div class="flex flex-center gap-1">
              <?php if (!empty($p['image'])): ?>
                <img src="<?= htmlspecialchars($p['image']) ?>"
                     style="width:32px;height:32px;object-fit:contain;border-radius:4px;border:1px solid var(--cream-border)" alt="">
              <?php else: ?>
                <div style="width:32px;height:32px;background:var(--cream);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.6rem;color:var(--ink-faint)">IMG</div>
              <?php endif; ?>
              <div>
                <div style="font-weight:600"><?= htmlspecialchars($p['name']) ?></div>
                <div class="text-xs text-muted mono"><?= htmlspecialchars($p['slug'] ?? '') ?></div>
              </div>
            </div>
          </td>
          <td><?= htmlspecialchars($p['brand']) ?></td>
          <?php if ($has_launch_price): ?>
          <td><?= $p['launch_price_inr'] ? '₹' . number_format($p['launch_price_inr']) : '<span class="text-muted">—</span>' ?></td>
          <?php endif; ?>
          <td class="text-sm text-muted"><?= !empty($p['release_date']) ? date('M Y', strtotime($p['release_date'])) : '—' ?></td>
          <td><span class="mono text-sm"><?= $p['spec_count'] ?></span></td>
          <td>
            <?php if (!empty($p['discontinued'])): ?>
              <span class="badge badge-gray">Discontinued</span>
            <?php elseif ($p['status'] == 1): ?>
              <span class="badge badge-green">Live</span>
            <?php else: ?>
              <span class="badge badge-amber">Draft</span>
            <?php endif; ?>
          </td>
          <td>
            <div class="td-actions">
              <a href="index.php?page=product-edit&id=<?= $p['id'] ?>" class="btn btn-sm btn-secondary">Edit</a>
              <a href="index.php?page=specs&id=<?= $p['id'] ?>"        class="btn btn-sm btn-secondary">Specs</a>
              <a href="index.php?page=quality&id=<?= $p['id'] ?>"      class="btn btn-sm btn-secondary">Quality</a>
              <a href="index.php?page=pricing&id=<?= $p['id'] ?>"      class="btn btn-sm btn-secondary">Prices</a>
              <a href="actions.php?action=delete_product&id=<?= $p['id'] ?>"
                 class="btn btn-sm btn-danger"
                 data-confirm="Delete <?= htmlspecialchars(addslashes($p['name'])) ?>? Cannot be undone.">Del</a>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>
  </div>

  <?php if ($pages > 1): ?>
  <div style="padding:1rem;border-top:1px solid var(--cream-border)">
    <div class="pagination">
      <?php if ($pg > 1): ?>
        <a href="?page=products&search=<?= urlencode($search) ?>&status=<?= urlencode($status) ?>&pg=<?= $pg-1 ?>" class="page-btn">← Prev</a>
      <?php endif; ?>
      <?php for ($i = max(1,$pg-2); $i <= min($pages,$pg+2); $i++): ?>
        <a href="?page=products&search=<?= urlencode($search) ?>&status=<?= urlencode($status) ?>&pg=<?= $i ?>"
           class="page-btn <?= $i===$pg?'active':'' ?>"><?= $i ?></a>
      <?php endfor; ?>
      <?php if ($pg < $pages): ?>
        <a href="?page=products&search=<?= urlencode($search) ?>&status=<?= urlencode($status) ?>&pg=<?= $pg+1 ?>" class="page-btn">Next →</a>
      <?php endif; ?>
      <span class="text-xs text-muted" style="margin-left:.5rem">Page <?= $pg ?> of <?= $pages ?> · <?= $total ?> phones</span>
    </div>
  </div>
  <?php endif; ?>
</div>
