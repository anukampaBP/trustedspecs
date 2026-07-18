<?php
// pages/parameters.php — List all parameters with edit/add/delete

$type_filter = intval($_GET['type'] ?? 1);
$cat_filter  = trim($_GET['cat'] ?? '');
$search      = trim($_GET['search'] ?? '');

$answer_types = ['N/A', 'Yes/No', 'Text', 'MCQ (Single)', 'MCQ (Multiple)', 'Date'];

// Handle delete
if (!empty($_GET['delete_param'])) {
    $del_id = intval($_GET['delete_param']);
    // Check if used in specs
    $used = $pdo->prepare('SELECT COUNT(*) FROM specs WHERE question = :id');
    $used->execute([':id' => $del_id]);
    if ($used->fetchColumn() > 0) {
        $error_msg = 'Cannot delete — this parameter has spec data. Remove specs first.';
    } else {
        $pdo->prepare('DELETE FROM parameters WHERE id = :id')->execute([':id' => $del_id]);
        header('Location: index.php?page=parameters&type=' . $type_filter);
        exit;
    }
}

// Build query
$where  = ['type = :type'];
$params = [':type' => $type_filter];
if ($cat_filter) {
    $where[]    = 'category = :cat';
    $params[':cat'] = $cat_filter;
}
if ($search) {
    $where[]    = 'parameter LIKE :s';
    $params[':s'] = '%' . $search . '%';
}
$where_sql = implode(' AND ', $where);

$rows = $pdo->prepare(
    "SELECT id, category, parameter, answer_type, options, sequence, mandatory
     FROM parameters WHERE $where_sql ORDER BY category, sequence, id"
);
$rows->execute($params);
$parameters = $rows->fetchAll();

// Get distinct categories for filter
$cats = $pdo->prepare('SELECT DISTINCT category FROM parameters WHERE type = :type ORDER BY category');
$cats->execute([':type' => $type_filter]);
$categories = $cats->fetchAll(PDO::FETCH_COLUMN);

$total = count($parameters);
?>

<div class="flex justify-between flex-center mb-3" style="flex-wrap:wrap;gap:1rem">
  <div>
    <span class="text-sm text-muted"><?= $total ?> parameters</span>
    <?php if (!empty($error_msg)): ?>
      <span class="badge badge-red" style="margin-left:.5rem"><?= htmlspecialchars($error_msg) ?></span>
    <?php endif; ?>
  </div>
  <a href="index.php?page=parameter-edit&type=<?= $type_filter ?>" class="btn btn-primary">+ Add Parameter</a>
</div>

<!-- Filters -->
<form method="GET" action="index.php" class="card mb-3" style="padding:1rem">
  <input type="hidden" name="page" value="parameters">
  <div class="flex gap-1" style="flex-wrap:wrap">
    <select name="type" style="width:140px">
      <option value="1" <?= $type_filter===1?'selected':'' ?>>Phones</option>
      <option value="2" <?= $type_filter===2?'selected':'' ?>>Tablets</option>
      <option value="3" <?= $type_filter===3?'selected':'' ?>>Smartwatches</option>
      <option value="4" <?= $type_filter===4?'selected':'' ?>>Laptops</option>
      <option value="5" <?= $type_filter===5?'selected':'' ?>>TVs</option>
    </select>
    <select name="cat" style="width:160px">
      <option value="">All categories</option>
      <?php foreach ($categories as $cat): ?>
        <option value="<?= htmlspecialchars($cat) ?>" <?= $cat_filter===$cat?'selected':'' ?>>
          <?= htmlspecialchars($cat) ?>
        </option>
      <?php endforeach; ?>
    </select>
    <input type="search" name="search" placeholder="Search parameter name…"
           value="<?= htmlspecialchars($search) ?>" style="flex:1;min-width:160px">
    <button type="submit" class="btn btn-secondary">Filter</button>
    <?php if ($cat_filter || $search): ?>
      <a href="index.php?page=parameters&type=<?= $type_filter ?>" class="btn btn-secondary">Clear</a>
    <?php endif; ?>
  </div>
</form>

<div class="card card-body-flush">
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:40px">#</th>
          <th>Parameter</th>
          <th>Category</th>
          <th>Type</th>
          <th>Options</th>
          <th style="width:60px;text-align:center">Seq</th>
          <th style="width:60px;text-align:center">Req</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($parameters)): ?>
          <tr><td colspan="8"><div class="empty-state">No parameters found.</div></td></tr>
        <?php else: ?>
        <?php
        $current_cat = null;
        foreach ($parameters as $p):
          if ($p['category'] !== $current_cat):
            $current_cat = $p['category'];
        ?>
          <tr>
            <td colspan="8" style="background:var(--purple-dim);padding:.4rem 1rem">
              <strong style="color:var(--purple);font-size:.8rem;text-transform:uppercase;letter-spacing:.05em">
                <?= htmlspecialchars($p['category']) ?>
              </strong>
            </td>
          </tr>
        <?php endif; ?>
        <tr>
          <td class="mono text-xs text-muted"><?= $p['id'] ?></td>
          <td>
            <span style="font-weight:<?= $p['mandatory']?'600':'400' ?>">
              <?= htmlspecialchars($p['parameter']) ?>
            </span>
          </td>
          <td class="text-sm text-muted"><?= htmlspecialchars($p['category']) ?></td>
          <td>
            <span class="badge <?= $p['answer_type']==1?'badge-green':($p['answer_type']>=3&&$p['answer_type']<=4?'badge-purple':($p['answer_type']==5?'badge-amber':'badge-gray')) ?>">
              <?= htmlspecialchars($answer_types[$p['answer_type']] ?? 'Unknown') ?>
            </span>
          </td>
          <td class="text-sm text-muted" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            <?php if ($p['answer_type'] >= 3 && $p['answer_type'] <= 4): ?>
              <?= htmlspecialchars($p['options']) ?>
            <?php else: ?>
              <span style="color:var(--ink-faint)">—</span>
            <?php endif; ?>
          </td>
          <td class="text-center mono text-sm"><?= $p['sequence'] ?></td>
          <td class="text-center">
            <?= $p['mandatory'] ? '<span class="badge badge-red">Yes</span>' : '' ?>
          </td>
          <td>
            <div class="td-actions">
              <a href="index.php?page=parameter-edit&id=<?= $p['id'] ?>"
                 class="btn btn-sm btn-secondary">Edit</a>
              <a href="index.php?page=parameters&type=<?= $type_filter ?>&delete_param=<?= $p['id'] ?>"
                 class="btn btn-sm btn-danger"
                 data-confirm="Delete &quot;<?= htmlspecialchars(addslashes($p['parameter'])) ?>&quot;?">Del</a>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>
