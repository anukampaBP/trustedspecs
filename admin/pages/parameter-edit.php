<?php
// pages/parameter-edit.php — Add / Edit a parameter

$id     = intval($_GET['id'] ?? 0);
$is_new = ($id === 0);
$default_type = intval($_GET['type'] ?? 1);

$answer_types = ['N/A', 'Yes/No', 'Text', 'MCQ (Single)', 'MCQ (Multiple)', 'Date'];

$product_types = [
    1 => 'Phones', 2 => 'Tablets', 3 => 'Smartwatches', 4 => 'Laptops', 5 => 'TVs',
];

$param = [
    'id' => 0, 'type' => $default_type, 'category' => '', 'parameter' => '',
    'answer_type' => 2, 'options' => '', 'sequence' => 0, 'mandatory' => 0,
    'dependency' => 0, 'dep_criteria' => '',
];

$save_msg = '';

if (!$is_new) {
    $stmt = $pdo->prepare('SELECT * FROM parameters WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) { echo '<div class="alert alert-error">Parameter not found.</div>'; return; }
    $param = array_merge($param, $row);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_param'])) {
    $param['type']        = intval($_POST['type'] ?? 1);
    $param['category']    = trim($_POST['category'] ?? '');
    $param['parameter']   = trim($_POST['parameter'] ?? '');
    $param['answer_type'] = intval($_POST['answer_type'] ?? 2);
    $param['options']     = trim($_POST['options'] ?? '');
    $param['sequence']    = intval($_POST['sequence'] ?? 0);
    $param['mandatory']   = isset($_POST['mandatory']) ? 1 : 0;
    $param['dependency']  = intval($_POST['dependency'] ?? 0);
    $param['dep_criteria']= trim($_POST['dep_criteria'] ?? '');

    // Clean options — normalise to semicolons
    if ($param['options']) {
        $opts = array_filter(array_map('trim',
            preg_split('/[;\n]+/', $param['options'])
        ));
        $param['options'] = implode(';', $opts);
    }

    if (empty($param['category']) || empty($param['parameter'])) {
        $save_msg = 'Category and parameter name are required.';
    } else {
        try {
            if ($is_new) {
                // Auto-assign next sequence in category
                if (!$param['sequence']) {
                    $max = $pdo->prepare(
                        'SELECT COALESCE(MAX(sequence),0)+1 FROM parameters WHERE type=:t AND category=:c'
                    );
                    $max->execute([':t'=>$param['type'],':c'=>$param['category']]);
                    $param['sequence'] = intval($max->fetchColumn());
                }
                $pdo->prepare(
                    'INSERT INTO parameters (type,category,parameter,answer_type,options,sequence,mandatory,dependency,dep_criteria,added)
                     VALUES (:type,:cat,:param,:at,:opts,:seq,:mand,:dep,:depc,NOW())'
                )->execute([
                    ':type'=>$param['type'], ':cat'=>$param['category'],
                    ':param'=>$param['parameter'], ':at'=>$param['answer_type'],
                    ':opts'=>$param['options'], ':seq'=>$param['sequence'],
                    ':mand'=>$param['mandatory'], ':dep'=>$param['dependency'],
                    ':depc'=>$param['dep_criteria'],
                ]);
                $new_id = $pdo->lastInsertId();
                header('Location: index.php?page=parameter-edit&id='.$new_id.'&saved=1');
                exit;
            } else {
                $pdo->prepare(
                    'UPDATE parameters SET type=:type,category=:cat,parameter=:param,
                     answer_type=:at,options=:opts,sequence=:seq,mandatory=:mand,
                     dependency=:dep,dep_criteria=:depc WHERE id=:id'
                )->execute([
                    ':type'=>$param['type'], ':cat'=>$param['category'],
                    ':param'=>$param['parameter'], ':at'=>$param['answer_type'],
                    ':opts'=>$param['options'], ':seq'=>$param['sequence'],
                    ':mand'=>$param['mandatory'], ':dep'=>$param['dependency'],
                    ':depc'=>$param['dep_criteria'], ':id'=>$id,
                ]);
                $save_msg = 'Parameter saved.';
            }
        } catch (PDOException $e) {
            $save_msg = 'Error: ' . $e->getMessage();
        }
    }
}

if (isset($_GET['saved'])) $save_msg = 'Parameter created.';

// Get existing categories for autocomplete
$existing_cats = $pdo->prepare('SELECT DISTINCT category FROM parameters WHERE type=:t ORDER BY category');
$existing_cats->execute([':t' => $param['type']]);
$existing_cats = $existing_cats->fetchAll(PDO::FETCH_COLUMN);

// Count how many specs use this parameter
$usage_count = 0;
if (!$is_new) {
    $usage_count = (int)$pdo->prepare('SELECT COUNT(*) FROM specs WHERE question=:id')
        ->execute([':id'=>$id]) ? $pdo->prepare('SELECT COUNT(*) FROM specs WHERE question=:id')
        ->execute([':id'=>$id]) : 0;
    $uc = $pdo->prepare('SELECT COUNT(*) FROM specs WHERE question=:id');
    $uc->execute([':id'=>$id]);
    $usage_count = (int)$uc->fetchColumn();
}
?>

<div class="flex justify-between flex-center mb-3" style="flex-wrap:wrap;gap:1rem">
  <a href="index.php?page=parameters&type=<?= $param['type'] ?>"
     class="btn btn-secondary btn-sm">← Parameters</a>
  <?php if (!$is_new && $usage_count): ?>
    <span class="badge badge-purple">Used in <?= $usage_count ?> spec entries</span>
  <?php endif; ?>
</div>

<?php if ($save_msg): ?>
<div class="alert <?= str_starts_with($save_msg,'Error')?'alert-error':'alert-success' ?>">
  <?= htmlspecialchars($save_msg) ?>
</div>
<?php endif; ?>

<form method="POST" action="">
<div class="grid-2" style="gap:1.5rem;align-items:start">

  <div class="card">
    <div class="card-header"><h2><?= $is_new ? 'New Parameter' : 'Edit Parameter' ?></h2></div>
    <div class="card-body">

      <div class="field">
        <label>Product Type</label>
        <select name="type">
          <?php foreach ($product_types as $val => $label): ?>
            <option value="<?= $val ?>" <?= intval($param['type'])===$val?'selected':'' ?>>
              <?= htmlspecialchars($label) ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>

      <div class="field">
        <label>Category *</label>
        <input type="text" name="category" id="cat-input" required
               list="cat-list"
               value="<?= htmlspecialchars($param['category']) ?>"
               placeholder="e.g. Display, Battery, Camera…">
        <datalist id="cat-list">
          <?php foreach ($existing_cats as $cat): ?>
            <option value="<?= htmlspecialchars($cat) ?>">
          <?php endforeach; ?>
        </datalist>
        <span class="field-hint">Pick an existing category or type a new one.</span>
      </div>

      <div class="field">
        <label>Parameter Name *</label>
        <input type="text" name="parameter" required
               value="<?= htmlspecialchars($param['parameter']) ?>"
               placeholder="e.g. Number of Cameras">
      </div>

      <div class="field">
        <label>Answer Type</label>
        <select name="answer_type" id="answer-type-select">
          <?php foreach ($answer_types as $idx => $label): ?>
            <option value="<?= $idx ?>" <?= intval($param['answer_type'])===$idx?'selected':'' ?>>
              <?= htmlspecialchars($label) ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>

      <div class="field" id="options-field"
           style="<?= in_array(intval($param['answer_type']),[1,3,4])?'':'display:none' ?>">
        <label>Options <span class="text-muted">(semicolon or newline separated)</span></label>
        <textarea name="options" rows="5"
                  placeholder="Option 1;Option 2;Option 3&#10;or one per line"
        ><?= htmlspecialchars(str_replace(';', ";\n", $param['options'])) ?></textarea>
        <span class="field-hint">
          For Yes/No: just type <code>Yes;No</code>.<br>
          For MCQ: e.g. <code>LCD IPS;OLED;AMOLED;Super AMOLED</code>
        </span>
      </div>

      <div class="form-row">
        <div class="field">
          <label>Sequence (sort order)</label>
          <input type="number" name="sequence" min="0"
                 value="<?= intval($param['sequence']) ?>">
          <span class="field-hint">Lower = appears first in its category.</span>
        </div>
        <div class="field">
          <label style="opacity:0">.</label>
          <div class="checkbox-row" style="margin-top:.55rem">
            <input type="checkbox" id="chk_mandatory" name="mandatory" value="1"
                   <?= $param['mandatory']?'checked':'' ?>>
            <label for="chk_mandatory">Required field</label>
          </div>
        </div>
      </div>

    </div>
  </div>

  <div>
    <div class="card mb-2">
      <div class="card-header"><h2>Dependency (optional)</h2></div>
      <div class="card-body">
        <p class="text-sm text-muted mb-2">
          Show this field only when another parameter has a specific value.
          E.g. "5G Bands" only shows when "5G" = Yes.
        </p>
        <div class="field">
          <label>Depends on Parameter ID</label>
          <input type="number" name="dependency" min="0"
                 value="<?= intval($param['dependency']) ?>"
                 placeholder="0 = no dependency">
        </div>
        <div class="field" style="margin-bottom:0">
          <label>Show when value is</label>
          <input type="text" name="dep_criteria"
                 value="<?= htmlspecialchars($param['dep_criteria']) ?>"
                 placeholder="e.g. Yes">
        </div>
      </div>
    </div>

    <?php if (!$is_new): ?>
    <div class="card">
      <div class="card-header"><h2>Usage</h2></div>
      <div class="card-body">
        <p class="text-sm">
          This parameter is used in <strong><?= $usage_count ?></strong> spec entries across all products.
        </p>
        <?php if ($usage_count === 0): ?>
          <p class="text-sm text-muted mt-1">Safe to delete.</p>
        <?php else: ?>
          <p class="text-sm text-muted mt-1">Cannot delete until all spec entries using it are removed.</p>
        <?php endif; ?>
      </div>
    </div>
    <?php endif; ?>
  </div>

</div>

<div style="margin-top:1.5rem;display:flex;gap:.75rem">
  <button type="submit" name="save_param" class="btn btn-primary">
    <?= $is_new ? 'Create Parameter' : 'Save Changes' ?>
  </button>
  <a href="index.php?page=parameters&type=<?= $param['type'] ?>" class="btn btn-secondary">Cancel</a>
</div>
</form>
