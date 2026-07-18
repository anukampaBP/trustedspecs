<?php
// pages/product-edit.php
$id = intval($_GET['id'] ?? 0);
$is_new = ($id === 0);

$product = [
    'id' => 0, 'name' => '', 'brand' => '', 'slug' => '', 'model_number' => '',
    'status' => 0, 'discontinued' => 0, 'release_date' => '', 'launch_price_inr' => '',
    'meta_description' => '', 'primary_image_url' => '',
    'affiliate_amazon' => '', 'affiliate_flipkart' => '', 'affiliate_croma' => '',
    'upgrade_tags' => '',
];

$success_msg = '';
$error_msg   = '';

if (!$is_new) {
    $stmt = $pdo->prepare('SELECT * FROM product WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if ($row) {
        $product = array_merge($product, $row);
    } else {
        echo '<div class="alert alert-error">Product not found.</div>';
        return;
    }
}

// Handle save
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_product'])) {
    $fields = ['name','brand','slug','model_number','release_date','launch_price_inr',
               'meta_description','primary_image_url',
               'affiliate_amazon','affiliate_flipkart','affiliate_croma','upgrade_tags'];
    foreach ($fields as $f) {
        $product[$f] = trim($_POST[$f] ?? '');
    }
    $product['status']       = isset($_POST['status']) ? 1 : 0;
    $product['discontinued'] = isset($_POST['discontinued']) ? 1 : 0;

    if (empty($product['name']) || empty($product['brand'])) {
        $error_msg = 'Name and brand are required.';
    } else {
        if (empty($product['slug'])) {
            $product['slug'] = strtolower(preg_replace('/[^a-z0-9]+/i','-', $product['name']));
        }
        try {
            if ($is_new) {
                $sql = 'INSERT INTO product (type,name,brand,slug,model_number,status,discontinued,is_discontinued,
                        release_date,launch_price_inr,meta_description,
                        primary_image_url,primary_image,
                        affiliate_amazon,affiliate_flipkart,affiliate_croma,upgrade_tags,added,completion)
                        VALUES (1,:name,:brand,:slug,:model,:status,:disc,:disc2,
                                :release,:price,:meta,:img,:img2,
                                :amz,:flip,:croma,:tags,NOW(),0)';
            } else {
                $sql = 'UPDATE product SET name=:name,brand=:brand,slug=:slug,model_number=:model,
                        status=:status,discontinued=:disc,is_discontinued=:disc2,
                        release_date=:release,launch_price_inr=:price,
                        meta_description=:meta,primary_image_url=:img,primary_image=:img2,
                        affiliate_amazon=:amz,affiliate_flipkart=:flip,affiliate_croma=:croma,
                        upgrade_tags=:tags WHERE id=:id';
            }
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':name'   => $product['name'],   ':brand'  => $product['brand'],
                ':slug'   => $product['slug'],   ':model'  => $product['model_number'],
                ':status' => $product['status'],
                ':disc'   => $product['discontinued'],
                ':disc2'  => $product['discontinued'],
                ':release'=> $product['release_date'] ?: null,
                ':price'  => $product['launch_price_inr'] ?: null,
                ':meta'   => $product['meta_description'],
                ':img'    => $product['primary_image_url'],
                ':img2'   => $product['primary_image_url'],
                ':amz'    => $product['affiliate_amazon'],
                ':flip'   => $product['affiliate_flipkart'],
                ':croma'  => $product['affiliate_croma'],
                ':tags'   => $product['upgrade_tags'],
            ] + ($is_new ? [] : [':id' => $id]));

            if ($is_new) {
                $new_id = $pdo->lastInsertId();
                header('Location: index.php?page=product-edit&id=' . $new_id . '&saved=1');
                exit;
            }
            $success_msg = 'Product saved.';
        } catch (PDOException $e) {
            $error_msg = 'DB error: ' . $e->getMessage();
        }
    }
}

if (isset($_GET['saved'])) $success_msg = 'Product created successfully.';
?>

<div class="flex justify-between flex-center mb-3" style="flex-wrap:wrap;gap:1rem">
  <a href="index.php?page=products" class="btn btn-secondary btn-sm">← Back to Products</a>
  <?php if (!$is_new): ?>
  <div class="flex gap-1">
    <a href="index.php?page=specs&id=<?= $id ?>" class="btn btn-secondary btn-sm">Edit Specs</a>
    <a href="index.php?page=quality&id=<?= $id ?>" class="btn btn-secondary btn-sm">Quality Scores</a>
    <a href="index.php?page=pricing&id=<?= $id ?>" class="btn btn-secondary btn-sm">Pricing</a>
  </div>
  <?php endif; ?>
</div>

<?php if ($success_msg): ?><div class="alert alert-success"><?= htmlspecialchars($success_msg) ?></div><?php endif; ?>
<?php if ($error_msg): ?><div class="alert alert-error"><?= htmlspecialchars($error_msg) ?></div><?php endif; ?>

<form method="POST" action="">
<div class="grid-2" style="gap:1.5rem;align-items:start">

  <!-- Left column -->
  <div>
    <div class="card mb-2">
      <div class="card-header"><h2>Basic Info</h2></div>
      <div class="card-body">
        <div class="form-row">
          <div class="field">
            <label for="product_name">Phone Name *</label>
            <input type="text" id="product_name" name="name" required
                   value="<?= htmlspecialchars($product['name']) ?>" placeholder="e.g. OnePlus 13">
          </div>
          <div class="field">
            <label for="product_brand">Brand *</label>
            <input type="text" name="brand" required
                   value="<?= htmlspecialchars($product['brand']) ?>" placeholder="e.g. OnePlus">
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="product_slug">URL Slug</label>
            <input type="text" id="product_slug" name="slug"
                   value="<?= htmlspecialchars($product['slug']) ?>" placeholder="auto-generated">
          </div>
          <div class="field">
            <label>Model Number</label>
            <input type="text" name="model_number"
                   value="<?= htmlspecialchars($product['model_number']) ?>" placeholder="e.g. CPH2583">
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label>Release Date</label>
            <input type="date" name="release_date"
                   value="<?= htmlspecialchars($product['release_date']) ?>">
          </div>
          <div class="field">
            <label>Launch Price (₹)</label>
            <input type="number" name="launch_price_inr"
                   value="<?= htmlspecialchars($product['launch_price_inr']) ?>" placeholder="e.g. 34999">
          </div>
        </div>
        <div class="field">
          <label>SEO Meta Description</label>
          <textarea name="meta_description" rows="3" placeholder="150–160 chars for Google…"><?= htmlspecialchars($product['meta_description']) ?></textarea>
        </div>
        <div class="field">
          <label>Upgrade Tags <span class="text-muted">(comma-separated: gaming, camera, battery…)</span></label>
          <input type="text" name="upgrade_tags"
                 value="<?= htmlspecialchars($product['upgrade_tags']) ?>"
                 placeholder="gaming, camera-phone, flagship">
          <span class="field-hint">Used by the Budget Explorer use-case filter.</span>
        </div>
        <div style="display:flex;gap:1.5rem;flex-wrap:wrap">
          <div class="checkbox-row">
            <input type="checkbox" id="chk_status" name="status" value="1" <?= $product['status'] ? 'checked' : '' ?>>
            <label for="chk_status">Published (live on site)</label>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="chk_disc" name="discontinued" value="1" <?= $product['discontinued'] ? 'checked' : '' ?>>
            <label for="chk_disc">Discontinued</label>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h2>Affiliate Links</h2></div>
      <div class="card-body">
        <div class="field">
          <label>Amazon Affiliate URL</label>
          <input type="url" name="affiliate_amazon"
                 value="<?= htmlspecialchars($product['affiliate_amazon']) ?>"
                 placeholder="https://amzn.to/...">
        </div>
        <div class="field">
          <label>Flipkart Affiliate URL</label>
          <input type="url" name="affiliate_flipkart"
                 value="<?= htmlspecialchars($product['affiliate_flipkart']) ?>"
                 placeholder="https://fkrt.it/...">
        </div>
        <div class="field">
          <label>Croma Affiliate URL</label>
          <input type="url" name="affiliate_croma"
                 value="<?= htmlspecialchars($product['affiliate_croma']) ?>"
                 placeholder="https://croma.com/...">
        </div>
      </div>
    </div>
  </div>

  <!-- Right column -->
  <div>
    <div class="card mb-2">
      <div class="card-header"><h2>Product Image</h2></div>
      <div class="card-body">
        <div class="img-dual-input" data-upload-path="actions.php?action=upload_image" data-img-type="product">
          <div class="img-preview-wrap mb-1">
            <img class="img-preview"
                 src="<?= htmlspecialchars($product['primary_image_url'] ?: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=') ?>"
                 alt="Product image"
                 style="<?= $product['primary_image_url'] ? '' : 'display:none' ?>">
            <div>
              <label class="img-upload-label">
                <svg style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2" viewBox="0 0 20 20"><path d="M4 17h12M10 4v9M6 8l4-4 4 4"/></svg>
                Upload image
                <input type="file" class="img-file-input" accept="image/*">
              </label>
              <p class="field-hint mt-1">PNG or JPG, 800×800px recommended</p>
            </div>
          </div>
          <div class="field" style="margin-bottom:0">
            <label>Or Image URL</label>
            <input type="url" name="primary_image_url" class="img-url-input"
                   value="<?= htmlspecialchars($product['primary_image_url']) ?>"
                   placeholder="https://…">
          </div>
        </div>
      </div>
    </div>

    <?php if (!$is_new): ?>
    <div class="card">
      <div class="card-header"><h2>Related Products</h2>
        <span class="text-xs text-muted">Shown in "Compare with" section</span>
      </div>
      <div class="card-body">
        <div class="field" style="margin-bottom:0">
          <label>Search &amp; add related phones</label>
          <div class="search-choose" data-api="actions.php?action=search_products" data-name="related_ids[]">
            <input type="text" class="search-choose-input" placeholder="Type phone name…">
            <div class="search-dropdown"></div>
            <div class="chosen-tags"></div>
            <div class="chosen-hidden"></div>
          </div>
          <span class="field-hint">These are not successor/predecessor — just editorial "compare with" suggestions.</span>
        </div>
      </div>
    </div>
    <?php endif; ?>
  </div>

</div>

<div style="margin-top:1.5rem;display:flex;gap:.75rem">
  <button type="submit" name="save_product" class="btn btn-primary">
    <?= $is_new ? 'Create Phone' : 'Save Changes' ?>
  </button>
  <a href="index.php?page=products" class="btn btn-secondary">Cancel</a>
</div>
</form>
