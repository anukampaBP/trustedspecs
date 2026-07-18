<?php
// pages/quality.php
// Confirmed scores schema:
//   product (FK), category (varchar100), specs (int), review (int), cs (int),
//   description (text), updated (datetime), confidence (enum low/medium/high),
//   review_count (tinyint), last_reviewed (date), reviewer_notes (text),
//   sources (json), overall_score (decimal 4,1), source_urls (text)
//
// The scores table stores ONE ROW PER CATEGORY per product.
// Existing categories appear to be: specs, review, cs (and possibly others)
// We treat each row as a scored dimension.

$id = intval($_GET['id'] ?? 0);
if (!$id) { echo '<div class="alert alert-error">No product ID.</div>'; return; }

$stmt = $pdo->prepare('SELECT id, name, brand FROM product WHERE id = :id');
$stmt->execute([':id' => $id]);
$product = $stmt->fetch();
if (!$product) { echo '<div class="alert alert-error">Product not found.</div>'; return; }

// The 8 quality dimensions we want to score — stored as separate rows by category
$dimensions = [
    'camera_day'   => 'Daytime Camera',
    'camera_night' => 'Night Camera',
    'video'        => 'Video',
    'gaming'       => 'Gaming',
    'battery'      => 'Battery Life',
    'speaker'      => 'Speaker',
    'call'         => 'Call Quality',
    'software'     => 'Software & UI',
];

// Load existing score rows for this product, keyed by category
$score_rows = $pdo->prepare(
    'SELECT * FROM scores WHERE product = :pid'
);
$score_rows->execute([':pid' => $id]);
$existing = [];
foreach ($score_rows->fetchAll() as $r) {
    $existing[$r['category']] = $r;
}

// Also load the overall score row if any
$overall_row = $existing['overall'] ?? null;

// Save
$save_msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_quality'])) {
    $scores      = $_POST['score']       ?? [];
    $notes       = $_POST['reviewer_notes'] ?? '';
    $confidence  = $_POST['confidence']  ?? 'medium';
    $review_count= intval($_POST['review_count'] ?? 0);
    $src_urls    = trim($_POST['source_urls'] ?? '');

    try {
        $pdo->beginTransaction();

        // Delete all existing score rows for this product then re-insert
        $pdo->prepare('DELETE FROM scores WHERE product = :pid')->execute([':pid' => $id]);

        $ins = $pdo->prepare(
            'INSERT INTO scores (product, category, specs, description, confidence,
                                 review_count, reviewer_notes, source_urls, last_reviewed, updated)
             VALUES (:pid, :cat, :score, :desc, :conf, :rc, :notes, :srcs, :reviewed, NOW())'
        );

        $total = 0; $count = 0;
        foreach ($dimensions as $key => $label) {
            $score = isset($scores[$key]) ? max(0, min(10, intval($scores[$key]))) : 0;
            $ins->execute([
                ':pid'      => $id,
                ':cat'      => $key,
                ':score'    => $score,
                ':desc'     => '',
                ':conf'     => $confidence,
                ':rc'       => $review_count,
                ':notes'    => $notes,
                ':srcs'     => $src_urls,
                ':reviewed' => date('Y-m-d'),
            ]);
            $total += $score; $count++;
        }

        // Insert overall row
        $overall = $count > 0 ? round($total / $count, 1) : 0;
        $ins->execute([
            ':pid'      => $id,
            ':cat'      => 'overall',
            ':score'    => $overall,
            ':desc'     => '',
            ':conf'     => $confidence,
            ':rc'       => $review_count,
            ':notes'    => $notes,
            ':srcs'     => $src_urls,
            ':reviewed' => date('Y-m-d'),
        ]);

        $pdo->commit();
        $save_msg = 'Quality scores saved. Overall: ' . $overall . '/10';

        // Reload
        $score_rows->execute([':pid' => $id]);
        $existing = [];
        foreach ($score_rows->fetchAll() as $r) $existing[$r['category']] = $r;
        $overall_row = $existing['overall'] ?? null;

    } catch (Exception $e) {
        $pdo->rollBack();
        $save_msg = 'Error: ' . $e->getMessage();
    }
}

// Get a shared value from existing rows (all rows share same notes/confidence/sources)
$shared = !empty($existing) ? array_values($existing)[0] : [];
?>

<div class="flex justify-between flex-center mb-3" style="flex-wrap:wrap;gap:1rem">
  <a href="index.php?page=products" class="btn btn-secondary btn-sm">← Products</a>
  <strong><?= htmlspecialchars($product['name']) ?> — Quality Scores</strong>
</div>

<?php if ($save_msg): ?>
<div class="alert <?= str_starts_with($save_msg,'Error')?'alert-error':'alert-success' ?>">
  <?= htmlspecialchars($save_msg) ?>
</div>
<?php endif; ?>

<div class="alert alert-info mb-2">
  <div>Score 0–10 per dimension based on YouTube reviews.
  0 = terrible · 5 = average · 10 = best in class.</div>
</div>

<form method="POST" action="">
<div class="card mb-2">
  <div class="card-header">
    <h2>Quality Dimensions</h2>
    <?php if ($overall_row): ?>
      <span class="badge badge-purple">
        Overall: <?= $overall_row['specs'] ?>/10
      </span>
      <?php if (!empty($overall_row['last_reviewed'])): ?>
        <span class="text-xs text-muted">
          Reviewed: <?= date('d M Y', strtotime($overall_row['last_reviewed'])) ?>
        </span>
      <?php endif; ?>
    <?php endif; ?>
  </div>
  <div class="card-body">
    <?php foreach ($dimensions as $key => $label): ?>
      <?php $score = isset($existing[$key]) ? intval($existing[$key]['specs']) : 0; ?>
      <div class="score-row" data-score-key="<?= $key ?>">
        <div class="score-name"><?= htmlspecialchars($label) ?></div>
        <input type="range" class="score-slider"
               name="score[<?= $key ?>]"
               min="0" max="10" step="1"
               value="<?= $score ?>">
        <div class="score-val" id="sv_<?= $key ?>"><?= $score ?: '—' ?></div>
        <div></div>
      </div>
    <?php endforeach; ?>
  </div>
</div>

<div class="card mb-2">
  <div class="card-header"><h2>Review Details</h2></div>
  <div class="card-body">
    <div class="form-row">
      <div class="field">
        <label>Confidence Level</label>
        <select name="confidence">
          <option value="low"    <?= ($shared['confidence']??'medium')==='low'   ?'selected':'' ?>>Low (1–2 reviews)</option>
          <option value="medium" <?= ($shared['confidence']??'medium')==='medium'?'selected':'' ?>>Medium (3–5 reviews)</option>
          <option value="high"   <?= ($shared['confidence']??'medium')==='high'  ?'selected':'' ?>>High (6+ reviews)</option>
        </select>
      </div>
      <div class="field">
        <label>Number of Reviews Watched</label>
        <input type="number" name="review_count" min="0" max="99"
               value="<?= intval($shared['review_count'] ?? 0) ?>">
      </div>
    </div>
    <div class="field">
      <label>Reviewer Notes <span class="text-muted">(shown publicly)</span></label>
      <textarea name="reviewer_notes" rows="4"
                placeholder="e.g. Strong main camera, weak ultrawide. Gets hot during gaming…"
      ><?= htmlspecialchars($shared['reviewer_notes'] ?? '') ?></textarea>
    </div>
    <div class="field" style="margin-bottom:0">
      <label>Source URLs <span class="text-muted">(one per line)</span></label>
      <textarea name="source_urls" rows="4"
                placeholder="https://youtube.com/watch?v=...&#10;https://..."
      ><?= htmlspecialchars($shared['source_urls'] ?? '') ?></textarea>
    </div>
  </div>
</div>

<button type="submit" name="save_quality" class="btn btn-primary">Save Scores</button>
</form>
