<?php
// pages/pricing.php
$id = intval($_GET['id'] ?? 0);

// If no ID, show all recent price entries
$view_all = ($id === 0);
$save_msg = '';

if (!$view_all) {
    $stmt = $pdo->prepare('SELECT id,name,brand FROM product WHERE id=:id');
    $stmt->execute([':id'=>$id]);
    $product = $stmt->fetch();
    if (!$product) { echo '<div class="alert alert-error">Product not found.</div>'; return; }
}

// Handle add/delete
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_price'])) {
    $pid   = intval($_POST['product_id']);
    $src   = trim($_POST['source'] ?? '');
    $price = floatval($_POST['price'] ?? 0);
    $var   = trim($_POST['variant'] ?? '');
    $aff   = trim($_POST['affiliate_url'] ?? '');
    $stock = isset($_POST['in_stock']) ? 1 : 0;

    if ($pid && $src && $price > 0) {
        try {
            $pdo->prepare(
                'INSERT INTO pricing (product_id,source,price_inr,variant,affiliate_url,in_stock,recorded_at)
                 VALUES (:pid,:src,:price,:var,:aff,:stock,NOW())'
            )->execute([':pid'=>$pid,':src'=>$src,':price'=>$price,':var'=>$var,':aff'=>$aff,':stock'=>$stock]);
            $save_msg = 'Price entry added.';
        } catch (PDOException $e) {
            $save_msg = 'Error: ' . $e->getMessage();
        }
    }
}

if ($_GET['del_price'] ?? '') {
    $del_id = intval($_GET['del_price']);
    $pdo->prepare('DELETE FROM pricing WHERE id=:id')->execute([':id'=>$del_id]);
    header('Location: index.php?page=pricing' . ($id ? '&id='.$id : ''));
    exit;
}

// Fetch price data
if (!$view_all) {
    $prices = $pdo->prepare(
        'SELECT * FROM pricing WHERE product_id=:pid ORDER BY recorded_at DESC LIMIT 100'
    );
    $prices->execute([':pid'=>$id]);
    $prices = $prices->fetchAll();
} else {
    // Show all recent prices with product name
    $prices = $pdo->query(
        'SELECT pr.*, p.name as product_name, p.brand
         FROM pricing pr JOIN product p ON p.id=pr.product_id
         ORDER BY pr.recorded_at DESC LIMIT 200'
    )->fetchAll();
}

// Best current price per source
$best = [];
foreach ($prices as $pr) {
    $src = $pr['source'];
    if (!isset($best[$src]) || $pr['price_inr'] < $best[$src]['price_inr']) {
        $best[$src] = $pr;
    }
}

$sources = ['Amazon','Flipkart','Croma','Tata Cliq','Reliance Digital','Manual'];
$source_colors = [
    'Amazon'=>'#FF9900','Flipkart'=>'#2874f0','Croma'=>'#9f1d35',
    'Tata Cliq'=>'#2b60de','Reliance Digital'=>'#11a12b','Manual'=>'#6d28d9'
];
?>

<div class="flex justify-between flex-center mb-3" style="flex-wrap:wrap;gap:1rem">
  <div>
    <?php if (!$view_all): ?>
      <a href="index.php?page=products" class="btn btn-secondary btn-sm">← Products</a>
      <strong style="margin-left:.75rem"><?= htmlspecialchars($product['name']) ?> — Pricing</strong>
    <?php else: ?>
      <h2 style="font-size:1rem">All Recent Prices</h2>
    <?php endif; ?>
  </div>
</div>

<?php if ($save_msg): ?>
<div class="alert <?= str_starts_with($save_msg,'Error')?'alert-error':'alert-success' ?>"><?= htmlspecialchars($save_msg) ?></div>
<?php endif; ?>

<!-- Best prices summary -->
<?php if (!$view_all && !empty($best)): ?>
<div class="card mb-2">
  <div class="card-header"><h2>Current Best Prices</h2></div>
  <div class="card-body" style="padding:.75rem 1.5rem">
    <div class="flex gap-2" style="flex-wrap:wrap">
    <?php foreach ($best as $src => $pr): ?>
      <div class="stat-card" style="flex:1;min-width:140px;padding:.85rem 1rem">
        <div class="stat-label" style="color:<?= $source_colors[$src] ?? '#555' ?>"><?= htmlspecialchars($src) ?></div>
        <div class="stat-value" style="font-size:1.4rem">₹<?= number_format($pr['price_inr']) ?></div>
        <?php if ($pr['variant']): ?><div class="stat-sub"><?= htmlspecialchars($pr['variant']) ?></div><?php endif; ?>
        <div class="mt-1">
          <?php if ($pr['in_stock']): ?>
            <span class="badge badge-green">In stock</span>
          <?php else: ?>
            <span class="badge badge-red">Out of stock</span>
          <?php endif; ?>
          <?php if ($pr['affiliate_url']): ?>
            <a href="<?= htmlspecialchars($pr['affiliate_url']) ?>" target="_blank" class="btn btn-sm btn-secondary" style="margin-left:.25rem">Buy</a>
          <?php endif; ?>
        </div>
      </div>
    <?php endforeach; ?>
    </div>
  </div>
</div>
<?php endif; ?>

<!-- Add price form -->
<?php if (!$view_all): ?>
<div class="card mb-2">
  <div class="card-header"><h2>Add Price Entry</h2></div>
  <div class="card-body">
    <form method="POST" action="">
      <input type="hidden" name="product_id" value="<?= $id ?>">
      <div class="form-row-3">
        <div class="field">
          <label>Source</label>
          <select name="source" required>
            <option value="">Select source…</option>
            <?php foreach ($sources as $s): ?>
              <option value="<?= htmlspecialchars($s) ?>"><?= htmlspecialchars($s) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="field">
          <label>Price (₹)</label>
          <input type="number" name="price" min="1" required placeholder="e.g. 34999">
        </div>
        <div class="field">
          <label>Variant</label>
          <input type="text" name="variant" placeholder="e.g. 8GB+128GB">
        </div>
      </div>
      <div class="field">
        <label>Affiliate / Buy URL</label>
        <input type="url" name="affiliate_url" placeholder="https://amzn.to/...">
      </div>
      <div class="checkbox-row mb-2">
        <input type="checkbox" name="in_stock" id="chk_instock" value="1" checked>
        <label for="chk_instock">Currently in stock</label>
      </div>
      <button type="submit" name="add_price" class="btn btn-primary btn-sm">Add Price Entry</button>
    </form>
  </div>
</div>
<?php endif; ?>

<!-- Automated tracker note -->
<div class="alert alert-info mb-2">
  <div>
    <strong>Auto price tracker:</strong> Set up a cron job at <code>cron/price_tracker.php</code> to run every 6 hours.
    It uses your Amazon PA-API + Flipkart Affiliate API credentials to auto-update prices.
    Configure credentials in <a href="index.php?page=settings">Settings</a>.
  </div>
</div>

<!-- Price history -->
<div class="card card-body-flush">
  <div class="card-header"><h2><?= $view_all ? 'All Recent Prices' : 'Price History' ?></h2></div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <?php if ($view_all): ?><th>Product</th><?php endif; ?>
          <th>Source</th>
          <th>Price</th>
          <th>Variant</th>
          <th>Stock</th>
          <th>Recorded</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($prices)): ?>
          <tr><td colspan="7"><div class="empty-state">No price data yet. Add entries above.</div></td></tr>
        <?php else: ?>
        <?php foreach ($prices as $pr): ?>
        <tr>
          <?php if ($view_all): ?>
          <td>
            <a href="index.php?page=pricing&id=<?= $pr['product_id'] ?>">
              <?= htmlspecialchars($pr['product_name'] ?? '') ?>
            </a>
          </td>
          <?php endif; ?>
          <td>
            <span class="price-source-tag" style="border-color:<?= $source_colors[$pr['source']] ?? '#ccc' ?>; color:<?= $source_colors[$pr['source']] ?? '#555' ?>">
              <?= htmlspecialchars($pr['source']) ?>
            </span>
          </td>
          <td class="mono" style="font-weight:600">₹<?= number_format($pr['price_inr']) ?></td>
          <td class="text-sm text-muted"><?= htmlspecialchars($pr['variant'] ?: '—') ?></td>
          <td><?= $pr['in_stock'] ? '<span class="badge badge-green">In stock</span>' : '<span class="badge badge-red">Out</span>' ?></td>
          <td class="text-sm text-muted"><?= date('d M Y H:i', strtotime($pr['recorded_at'])) ?></td>
          <td>
            <a href="index.php?page=pricing&id=<?= $id ?>&del_price=<?= $pr['id'] ?>"
               class="btn btn-sm btn-danger"
               data-confirm="Delete this price entry?">Del</a>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>
