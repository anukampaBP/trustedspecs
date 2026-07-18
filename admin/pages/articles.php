<?php
// pages/articles.php
$pg = max(1, intval($_GET['pg'] ?? 1));
$per_page = 20;
$search = trim($_GET['search'] ?? '');
$type_filter = $_GET['type'] ?? '';

$where = ['1=1'];
$params = [];
if ($search) {
    $where[] = '(title LIKE :s OR excerpt LIKE :s2)';
    $params[':s'] = '%' . $search . '%';
    $params[':s2'] = '%' . $search . '%';
}
if ($type_filter) {
    $where[] = 'type = :type';
    $params[':type'] = $type_filter;
}
$where_sql = implode(' AND ', $where);

$total = (function() use ($pdo, $where_sql, $params) {
    $s = $pdo->prepare("SELECT COUNT(*) FROM articles WHERE $where_sql");
    $s->execute($params); return $s->fetchColumn();
})();

$pages   = max(1, ceil($total / $per_page));
$offset  = ($pg - 1) * $per_page;

$stmt = $pdo->prepare(
    "SELECT id,title,slug,type,status,read_time_minutes,published_at,created_at
     FROM articles WHERE $where_sql ORDER BY created_at DESC LIMIT :lim OFFSET :off"
);
foreach ($params as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':lim', $per_page, PDO::PARAM_INT);
$stmt->bindValue(':off', $offset,   PDO::PARAM_INT);
$stmt->execute();
$articles = $stmt->fetchAll();

$article_types = ['news','comparison','roundup','review','buying_guide','analysis'];
$type_labels   = ['news'=>'News','comparison'=>'Comparison','roundup'=>'Roundup',
                  'review'=>'Review','buying_guide'=>'Buying Guide','analysis'=>'Analysis'];
?>

<div class="flex justify-between flex-center mb-3" style="flex-wrap:wrap;gap:1rem">
  <div>
    <span class="text-sm text-muted"><?= $total ?> articles</span>
  </div>
  <div class="flex gap-1">
    <a href="index.php?page=news-fetcher" class="btn btn-secondary">
      📡 Fetch News
    </a>
    <a href="index.php?page=article-edit" class="btn btn-primary">+ Write Article</a>
  </div>
</div>

<form method="GET" action="index.php" class="card mb-3" style="padding:1rem">
  <input type="hidden" name="page" value="articles">
  <div class="flex gap-1" style="flex-wrap:wrap">
    <input type="search" name="search" placeholder="Search articles…"
           value="<?= htmlspecialchars($search) ?>" style="flex:1;min-width:200px">
    <select name="type" style="width:160px">
      <option value="">All types</option>
      <?php foreach ($article_types as $t): ?>
        <option value="<?= $t ?>" <?= $type_filter===$t?'selected':'' ?>><?= $type_labels[$t] ?></option>
      <?php endforeach; ?>
    </select>
    <button type="submit" class="btn btn-secondary">Filter</button>
    <?php if ($search || $type_filter): ?>
      <a href="index.php?page=articles" class="btn btn-secondary">Clear</a>
    <?php endif; ?>
  </div>
</form>

<div class="card card-body-flush">
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Read time</th>
          <th>Status</th>
          <th>Published</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($articles)): ?>
          <tr><td colspan="6"><div class="empty-state">No articles yet. Write one or use the News Fetcher.</div></td></tr>
        <?php else: ?>
        <?php foreach ($articles as $a): ?>
        <tr>
          <td>
            <div style="font-weight:600;font-size:.875rem"><?= htmlspecialchars($a['title']) ?></div>
            <div class="text-xs mono text-muted">/<?= htmlspecialchars($a['slug']) ?></div>
          </td>
          <td><span class="badge badge-purple"><?= htmlspecialchars($type_labels[$a['type']] ?? $a['type']) ?></span></td>
          <td class="text-sm text-muted"><?= $a['read_time_minutes'] ? $a['read_time_minutes'] . ' min' : '—' ?></td>
          <td>
            <?php if ($a['status'] === 'published'): ?>
              <span class="badge badge-green">Published</span>
            <?php else: ?>
              <span class="badge badge-amber">Draft</span>
            <?php endif; ?>
          </td>
          <td class="text-sm text-muted">
            <?= $a['published_at'] ? date('d M Y', strtotime($a['published_at'])) : '—' ?>
          </td>
          <td>
            <div class="td-actions">
              <a href="index.php?page=article-edit&id=<?= $a['id'] ?>" class="btn btn-sm btn-secondary">Edit</a>
              <a href="actions.php?action=delete_article&id=<?= $a['id'] ?>"
                 class="btn btn-sm btn-danger"
                 data-confirm="Delete &quot;<?= htmlspecialchars(addslashes($a['title'])) ?>&quot;?">Del</a>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>
