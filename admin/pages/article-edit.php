<?php
// pages/article-edit.php
$id     = intval($_GET['id'] ?? 0);
$is_new = ($id === 0);

$article = [
    'id'=>0,'title'=>'','slug'=>'','type'=>'news','status'=>'draft',
    'excerpt'=>'','content'=>'','cover_image_url'=>'',
    'meta_description'=>'','read_time_minutes'=>'','published_at'=>'',
];

$save_msg = '';

if (!$is_new) {
    $stmt = $pdo->prepare('SELECT * FROM articles WHERE id=:id');
    $stmt->execute([':id'=>$id]);
    $row = $stmt->fetch();
    if (!$row) { echo '<div class="alert alert-error">Article not found.</div>'; return; }
    $article = array_merge($article, $row);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_article'])) {
    $fields = ['title','slug','type','excerpt','content','cover_image_url','meta_description','read_time_minutes'];
    foreach ($fields as $f) $article[$f] = trim($_POST[$f] ?? '');
    $article['status'] = $_POST['status'] ?? 'draft';

    // Published date
    if ($article['status'] === 'published' && empty($article['published_at'])) {
        $article['published_at'] = date('Y-m-d H:i:s');
    } elseif (!empty($_POST['published_at'])) {
        $article['published_at'] = $_POST['published_at'];
    }

    if (empty($article['title'])) {
        $save_msg = 'Title is required.';
    } else {
        if (empty($article['slug'])) {
            $article['slug'] = strtolower(preg_replace('/[^a-z0-9]+/i','-', $article['title']));
        }
        // Auto read time from word count
        if (empty($article['read_time_minutes']) && $article['content']) {
            $words = str_word_count(strip_tags($article['content']));
            $article['read_time_minutes'] = max(1, round($words / 200));
        }
        try {
            if ($is_new) {
                $sql = 'INSERT INTO articles (title,slug,type,status,excerpt,content,cover_image_url,
                        meta_description,read_time_minutes,published_at,created_at,updated_at)
                        VALUES (:title,:slug,:type,:status,:excerpt,:content,:img,:meta,:rt,:pub,NOW(),NOW())';
            } else {
                $sql = 'UPDATE articles SET title=:title,slug=:slug,type=:type,status=:status,
                        excerpt=:excerpt,content=:content,cover_image_url=:img,meta_description=:meta,
                        read_time_minutes=:rt,published_at=:pub,updated_at=NOW() WHERE id=:id';
            }
            $stmt2 = $pdo->prepare($sql);
            $bind = [
                ':title'=>$article['title'],':slug'=>$article['slug'],':type'=>$article['type'],
                ':status'=>$article['status'],':excerpt'=>$article['excerpt'],
                ':content'=>$article['content'],':img'=>$article['cover_image_url'],
                ':meta'=>$article['meta_description'],
                ':rt'=>$article['read_time_minutes']?:null,
                ':pub'=>$article['published_at']?:null,
            ];
            if (!$is_new) $bind[':id'] = $id;
            $stmt2->execute($bind);
            if ($is_new) {
                header('Location: index.php?page=article-edit&id='.$pdo->lastInsertId().'&saved=1');
                exit;
            }
            $save_msg = 'Saved.';
        } catch (PDOException $e) {
            $save_msg = 'Error: ' . $e->getMessage();
        }
    }
}

if (isset($_GET['saved'])) $save_msg = 'Article created.';

$article_types = ['news'=>'News','comparison'=>'Comparison','roundup'=>'Roundup',
                  'review'=>'Review','buying_guide'=>'Buying Guide','analysis'=>'Analysis'];
?>

<div class="flex justify-between flex-center mb-3" style="flex-wrap:wrap;gap:1rem">
  <a href="index.php?page=articles" class="btn btn-secondary btn-sm">← Articles</a>
</div>

<?php if ($save_msg): ?>
<div class="alert <?= str_starts_with($save_msg,'Error')?'alert-error':'alert-success' ?>"><?= htmlspecialchars($save_msg) ?></div>
<?php endif; ?>

<form method="POST" action="">
<div class="grid-2" style="gap:1.5rem;align-items:start">

  <div>
    <!-- Main content -->
    <div class="card mb-2">
      <div class="card-header"><h2><?= $is_new ? 'New Article' : 'Edit Article' ?></h2></div>
      <div class="card-body">
        <div class="field">
          <label for="article_title">Title *</label>
          <input type="text" id="article_title" name="title" required
                 value="<?= htmlspecialchars($article['title']) ?>"
                 placeholder="e.g. OnePlus 13 Review: Best Flagship Under ₹70,000?">
        </div>
        <div class="form-row">
          <div class="field">
            <label for="article_slug">URL Slug</label>
            <input type="text" id="article_slug" name="slug"
                   value="<?= htmlspecialchars($article['slug']) ?>" placeholder="auto-generated">
          </div>
          <div class="field">
            <label>Type</label>
            <select name="type">
              <?php foreach ($article_types as $val => $label): ?>
                <option value="<?= $val ?>" <?= $article['type']===$val?'selected':'' ?>><?= $label ?></option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Excerpt <span class="text-muted">(2–3 sentences, shown in listings)</span></label>
          <textarea name="excerpt" rows="3" placeholder="Brief summary of the article…"><?= htmlspecialchars($article['excerpt']) ?></textarea>
        </div>

        <!-- HTML editor with toolbar -->
        <div class="field" style="margin-bottom:0">
          <label>Content (HTML)</label>
          <div class="editor-toolbar" id="editor-toolbar">
            <button type="button" class="btn" data-wrap="h2">H2</button>
            <button type="button" class="btn" data-wrap="h3">H3</button>
            <button type="button" class="btn" data-wrap="p">¶ P</button>
            <button type="button" class="btn" data-insert="---divider---">── Divider</button>
            <button type="button" class="btn" data-wrap="strong">B</button>
            <button type="button" class="btn" data-wrap="em">I</button>
            <button type="button" class="btn" data-wrap="a href=&quot;&quot;">🔗 Link</button>
            <button type="button" class="btn" data-insert-block="ul">• List</button>
            <button type="button" class="btn" data-insert-block="ol">1. List</button>
            <button type="button" class="btn" data-insert-block="specs-table">📊 Specs Table</button>
            <button type="button" class="btn" data-insert-block="pro-con">✓ Pro/Con</button>
            <button type="button" class="btn" data-insert-block="verdict">⭐ Verdict</button>
            <button type="button" class="btn" data-insert-block="buy-box">🛒 Buy Box</button>
            <button type="button" class="btn" data-insert-block="callout">💡 Callout</button>
          </div>
          <textarea class="editor-content w-full" name="content" id="article-content"><?= htmlspecialchars($article['content']) ?></textarea>
        </div>
      </div>
    </div>
  </div>

  <div>
    <!-- Sidebar options -->
    <div class="card mb-2">
      <div class="card-header"><h2>Publish</h2></div>
      <div class="card-body">
        <div class="field">
          <label>Status</label>
          <select name="status">
            <option value="draft" <?= $article['status']==='draft'?'selected':'' ?>>Draft</option>
            <option value="published" <?= $article['status']==='published'?'selected':'' ?>>Published</option>
          </select>
        </div>
        <div class="field">
          <label>Publish Date</label>
          <input type="datetime-local" name="published_at"
                 value="<?= $article['published_at'] ? date('Y-m-d\TH:i', strtotime($article['published_at'])) : '' ?>">
        </div>
        <div class="field" style="margin-bottom:0">
          <label>Read Time (minutes)</label>
          <input type="number" name="read_time_minutes" min="1" max="60"
                 value="<?= htmlspecialchars($article['read_time_minutes']) ?>"
                 placeholder="Auto-calculated">
        </div>
      </div>
    </div>

    <div class="card mb-2">
      <div class="card-header"><h2>Cover Image</h2></div>
      <div class="card-body">
        <div class="img-dual-input" data-img-type="article">
          <div class="img-preview-wrap mb-1" style="flex-direction:column;align-items:flex-start">
            <?php if ($article['cover_image_url']): ?>
              <img class="img-preview" src="<?= htmlspecialchars($article['cover_image_url']) ?>" alt="" style="width:100%;max-height:140px;object-fit:cover;border-radius:6px;margin-bottom:.5rem">
            <?php else: ?>
              <img class="img-preview" src="" alt="" style="display:none;width:100%;max-height:140px;object-fit:cover;border-radius:6px;margin-bottom:.5rem">
            <?php endif; ?>
            <label class="img-upload-label">
              <svg style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2" viewBox="0 0 20 20"><path d="M4 17h12M10 4v9M6 8l4-4 4 4"/></svg>
              Upload cover
              <input type="file" class="img-file-input" accept="image/*">
            </label>
          </div>
          <div class="field" style="margin-bottom:0">
            <label>Or Image URL</label>
            <input type="url" name="cover_image_url" class="img-url-input"
                   value="<?= htmlspecialchars($article['cover_image_url']) ?>" placeholder="https://…">
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-2">
      <div class="card-header"><h2>SEO</h2></div>
      <div class="card-body">
        <div class="field" style="margin-bottom:0">
          <label>Meta Description</label>
          <textarea name="meta_description" rows="3" placeholder="150–160 chars…"><?= htmlspecialchars($article['meta_description']) ?></textarea>
        </div>
      </div>
    </div>

    <?php if (!$is_new): ?>
    <div class="card">
      <div class="card-header"><h2>Related Phones</h2></div>
      <div class="card-body">
        <div class="search-choose" data-api="actions.php?action=search_products" data-name="related_product_ids[]">
          <input type="text" class="search-choose-input" placeholder="Search phones…">
          <div class="search-dropdown"></div>
          <div class="chosen-tags"></div>
          <div class="chosen-hidden"></div>
        </div>
        <span class="field-hint">Links this article to phone pages.</span>
      </div>
    </div>
    <?php endif; ?>
  </div>

</div>

<div style="margin-top:1.5rem;display:flex;gap:.75rem">
  <button type="submit" name="save_article" class="btn btn-primary">
    <?= $is_new ? 'Create Article' : 'Save Article' ?>
  </button>
  <a href="index.php?page=articles" class="btn btn-secondary">Cancel</a>
</div>
</form>
