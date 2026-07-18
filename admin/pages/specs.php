<?php
// pages/specs.php
// Confirmed schemas:
//   specs:      id, product (FK), question (FK→parameters.id), answer, speculated, ts
//   parameters: id, type, category, parameter (name), answer_type (int), options (text, semicolon-separated),
//               dependency, dep_criteria, sequence, mandatory, added
//
// answer_type mapping (confirmed):
//   0 = N/A  →  skip / text fallback
//   1 = Yes/No  →  dropdown Yes/No  (options col has "Yes;No")
//   2 = Text  →  plain text input  (options col is just completion hints, ignore)
//   3 = MCQ Single  →  dropdown from options
//   4 = MCQ Multiple  →  checkboxes from options
//   5 = Date  →  date input

$id = intval($_GET['id'] ?? 0);
if (!$id) { echo '<div class="alert alert-error">No product ID specified.</div>'; return; }

$stmt = $pdo->prepare('SELECT id, name, brand FROM product WHERE id = :id');
$stmt->execute([':id' => $id]);
$product = $stmt->fetch();
if (!$product) { echo '<div class="alert alert-error">Product not found.</div>'; return; }

// Load parameters grouped by category, ordered by sequence
$params_rows = $pdo->query(
    'SELECT id, category, parameter, answer_type, options, sequence, mandatory
     FROM parameters
     WHERE type = 1
     ORDER BY category, sequence, id'
)->fetchAll();

$categories = [];
foreach ($params_rows as $p) {
    $cat = trim($p['category']) ?: 'Other';
    $categories[$cat][] = $p;
}

// Load existing specs for this product keyed by parameter id
$spec_rows = $pdo->prepare(
    'SELECT question, answer, speculated FROM specs WHERE product = :pid'
);
$spec_rows->execute([':pid' => $id]);
$existing_specs = [];
foreach ($spec_rows->fetchAll() as $r) {
    $existing_specs[intval($r['question'])] = $r;
}
$filled_count = count($existing_specs);

// Save handler
$save_msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_specs'])) {
    $pdo->beginTransaction();
    try {
        $pdo->prepare('DELETE FROM specs WHERE product = :pid')->execute([':pid' => $id]);
        $ins = $pdo->prepare(
            'INSERT INTO specs (product, question, answer, speculated, ts)
             VALUES (:pid, :q, :ans, :spec, NOW())'
        );
        $spec_data = $_POST['spec']      ?? [];
        $est_data  = $_POST['estimated'] ?? [];
        $saved = 0;
        foreach ($spec_data as $param_id => $value) {
            if (is_array($value)) {
                $value = implode(';', array_filter(array_map('trim', $value)));
            }
            $value = trim($value);
            if ($value === '') continue;
            $ins->execute([
                ':pid'  => $id,
                ':q'    => intval($param_id),
                ':ans'  => $value,
                ':spec' => isset($est_data[$param_id]) ? 1 : 0,
            ]);
            $saved++;
        }
        $pdo->commit();
        // Reload
        $spec_rows->execute([':pid' => $id]);
        $existing_specs = [];
        foreach ($spec_rows->fetchAll() as $r) {
            $existing_specs[intval($r['question'])] = $r;
        }
        $filled_count = count($existing_specs);
        $save_msg = "Saved $saved specs.";
    } catch (Exception $e) {
        $pdo->rollBack();
        $save_msg = 'Error: ' . $e->getMessage();
    }
}

$cat_icons = [
    'Audio'=>'🔊','Back-Camera'=>'📷','Battery'=>'🔋','Benchmarks'=>'📊',
    'Bio'=>'📋','Build'=>'🏗','Communications'=>'📶','Display'=>'🖥',
    'Front-Camera'=>'🤳','Network'=>'📡','Other'=>'⚙','Platform'=>'⚡',
    'Pricing'=>'💰','Security'=>'🔒','Sensors'=>'🔬','Storage'=>'💾',
    'Tags'=>'🏷',
];

// Parse options: semicolon-separated, ignore answer_type=2 options (just hints)
function parse_options(string $raw): array {
    $raw = trim($raw);
    if ($raw === '') return [];
    return array_filter(array_map('trim', explode(';', $raw)));
}
?>

<div class="flex justify-between flex-center mb-3" style="flex-wrap:wrap;gap:1rem">
  <div>
    <a href="index.php?page=products" class="btn btn-secondary btn-sm">← Products</a>
    <strong style="margin-left:.75rem"><?= htmlspecialchars($product['name']) ?></strong>
  </div>
</div>

<?php if ($save_msg): ?>
<div class="alert <?= str_starts_with($save_msg,'Error')?'alert-error':'alert-success' ?>">
  <?= htmlspecialchars($save_msg) ?>
</div>
<?php endif; ?>

<form method="POST" action="">
<div class="card mb-2">
  <div class="card-header">
    <h2>Specs — <?= htmlspecialchars($product['name']) ?></h2>
    <div class="flex gap-1 flex-center">
      <span class="text-sm text-muted"><?= $filled_count ?> of <?= count($params_rows) ?> filled</span>
      <button type="submit" name="save_specs" class="btn btn-primary btn-sm">Save all specs</button>
    </div>
  </div>
  <div class="card-body">

    <!-- Category tabs -->
    <div id="spec-tabs" style="display:flex;gap:.25rem;border-bottom:2px solid var(--cream-border);margin-bottom:1.5rem;flex-wrap:wrap">
      <?php foreach (array_keys($categories) as $cat): ?>
        <button type="button" class="tab-btn" data-cat="<?= htmlspecialchars($cat) ?>">
          <?= ($cat_icons[$cat] ?? '⚙') . ' ' . htmlspecialchars($cat) ?>
        </button>
      <?php endforeach; ?>
    </div>

    <div id="spec-panes">
    <?php foreach ($categories as $cat => $cat_params): ?>
    <div class="tab-pane" data-cat-pane="<?= htmlspecialchars($cat) ?>">
      <table style="width:100%">
        <thead>
          <tr>
            <th style="width:35%">Spec</th>
            <th>Value</th>
            <th style="width:90px;text-align:center">Estimated</th>
          </tr>
        </thead>
        <tbody>
        <?php foreach ($cat_params as $param): ?>
          <?php
            $at      = intval($param['answer_type']);
            $existing = $existing_specs[intval($param['id'])] ?? null;
            $val      = $existing['answer'] ?? '';
            $est      = !empty($existing['speculated']);
            $fname    = 'spec[' . $param['id'] . ']';
            $options  = ($at === 1 || $at === 3 || $at === 4)
                          ? parse_options($param['options'])
                          : [];
          ?>
          <tr style="<?= $val !== '' ? 'background:var(--cream)' : '' ?>">
            <td>
              <div style="font-size:.875rem;font-weight:<?= $val!==''?'600':'400' ?>">
                <?= htmlspecialchars($param['parameter']) ?>
              </div>
              <?php if ($param['mandatory']): ?>
                <span class="text-xs" style="color:var(--red)">required</span>
              <?php endif; ?>
            </td>
            <td>

              <?php if ($at === 0): ?>
                <input type="text" name="<?= $fname ?>" value="<?= htmlspecialchars($val) ?>"
                       placeholder="N/A" style="color:var(--ink-faint)">

              <?php elseif ($at === 1): ?>
                <select name="<?= $fname ?>">
                  <option value="">—</option>
                  <?php foreach ($options as $opt): ?>
                    <option value="<?= htmlspecialchars($opt) ?>"
                            <?= trim($val)===trim($opt)?'selected':'' ?>>
                      <?= htmlspecialchars($opt) ?>
                    </option>
                  <?php endforeach; ?>
                </select>

              <?php elseif ($at === 2): ?>
                <input type="text" name="<?= $fname ?>"
                       value="<?= htmlspecialchars($val) ?>">

              <?php elseif ($at === 3): ?>
                <select name="<?= $fname ?>">
                  <option value="">—</option>
                  <?php foreach ($options as $opt): ?>
                    <option value="<?= htmlspecialchars($opt) ?>"
                            <?= trim($val)===trim($opt)?'selected':'' ?>>
                      <?= htmlspecialchars($opt) ?>
                    </option>
                  <?php endforeach; ?>
                </select>

              <?php elseif ($at === 4): ?>
                <?php
                  $sel_vals = $val !== '' ? array_map('trim', explode(';', $val)) : [];
                ?>
                <div style="display:flex;flex-wrap:wrap;gap:.5rem">
                  <?php foreach ($options as $opt): ?>
                    <label class="checkbox-row" style="margin:0">
                      <input type="checkbox" name="<?= $fname ?>[]"
                             value="<?= htmlspecialchars($opt) ?>"
                             <?= in_array(trim($opt), $sel_vals)?'checked':'' ?>>
                      <span style="font-size:.82rem"><?= htmlspecialchars($opt) ?></span>
                    </label>
                  <?php endforeach; ?>
                </div>

              <?php elseif ($at === 5): ?>
                <input type="date" name="<?= $fname ?>"
                       value="<?= htmlspecialchars($val) ?>">

              <?php else: ?>
                <input type="text" name="<?= $fname ?>"
                       value="<?= htmlspecialchars($val) ?>">
              <?php endif; ?>

            </td>
            <td style="text-align:center">
              <input type="checkbox" name="estimated[<?= $param['id'] ?>]"
                     value="1" <?= $est?'checked':'' ?>>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php endforeach; ?>
    </div>

  </div>
</div>
<button type="submit" name="save_specs" class="btn btn-primary">Save all specs</button>
</form>
