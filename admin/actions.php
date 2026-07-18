<?php
// actions.php — AJAX/form action handler (no HTML output, always JSON)
session_start();

if (empty($_SESSION['ts_admin'])) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
    exit;
}

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $pdo = ts_db();
} catch (PDOException $e) {
    echo json_encode(['ok' => false, 'error' => 'DB: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// ── search_products ───────────────────────────────────────────────────────────
if ($action === 'search_products') {
    $q = '%' . trim($_GET['q'] ?? '') . '%';
    $stmt = $pdo->prepare(
        'SELECT p.id, p.name, p.brand, p.primary_image_url as image
         FROM product p
         WHERE p.name LIKE :q OR p.brand LIKE :q2
         ORDER BY p.name LIMIT 12'
    );
    $stmt->execute([':q' => $q, ':q2' => $q]);
    $out = [];
    foreach ($stmt->fetchAll() as $r) {
        $out[] = ['id' => $r['id'], 'name' => $r['name'], 'sub' => $r['brand'], 'image' => $r['image'] ?? ''];
    }
    echo json_encode($out);
    exit;
}

// ── delete_product ────────────────────────────────────────────────────────────
if ($action === 'delete_product') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) { echo json_encode(['ok' => false, 'error' => 'No ID']); exit; }
    $pdo->prepare('DELETE FROM product WHERE id = :id')->execute([':id' => $id]);
    // GET request = redirect, POST = JSON
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        header('Location: index.php?page=products');
        exit;
    }
    echo json_encode(['ok' => true, 'message' => 'Deleted']);
    exit;
}

// ── delete_article ────────────────────────────────────────────────────────────
if ($action === 'delete_article') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) { echo json_encode(['ok' => false, 'error' => 'No ID']); exit; }
    $pdo->prepare('DELETE FROM articles WHERE id = :id')->execute([':id' => $id]);
    header('Location: index.php?page=articles');
    exit;
}

// ── upload_image ──────────────────────────────────────────────────────────────
if ($action === 'upload_image') {
    if (empty($_FILES['file']['tmp_name'])) {
        echo json_encode(['ok' => false, 'error' => 'No file received']); exit;
    }
    $file    = $_FILES['file'];
    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    $finfo   = finfo_open(FILEINFO_MIME_TYPE);
    $mime    = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mime, $allowed)) {
        echo json_encode(['ok' => false, 'error' => 'Invalid file type: ' . $mime]); exit;
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        echo json_encode(['ok' => false, 'error' => 'Max 5MB']); exit;
    }
    $type = preg_replace('/[^a-z]/', '', $_POST['type'] ?? 'product');
    // Go up from admin/ to public_html/ level, then into shared uploads folder
    $dir = dirname(__DIR__) . '/uploads/' . $type . '/';
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        echo json_encode(['ok' => false, 'error' => 'Cannot create upload dir']); exit;
    }
    $exts    = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    $ext     = $exts[$mime] ?? 'jpg';
    $fname   = uniqid($type . '_', true) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], $dir . $fname)) {
        echo json_encode(['ok' => false, 'error' => 'Move failed']); exit;
    }
    // Adjust base URL to your actual uploads location
    $url = 'https://trustedspecs.com/uploads/' . $type . '/' . $fname;
    echo json_encode(['ok' => true, 'url' => $url]);
    exit;
}

// ── save_product_image ────────────────────────────────────────────────────────
if ($action === 'save_product_image') {
    $pid = intval($_POST['product_id'] ?? 0);
    $url = trim($_POST['image_url'] ?? '');
    if (!$pid || !$url) { echo json_encode(['ok' => false, 'error' => 'Missing data']); exit; }
    $pdo->prepare('UPDATE product SET primary_image_url = :url WHERE id = :id')
        ->execute([':url' => $url, ':id' => $pid]);
    echo json_encode(['ok' => true]);
    exit;
}

// ── phones_no_image ───────────────────────────────────────────────────────────
if ($action === 'phones_no_image') {
    $stmt = $pdo->query(
        'SELECT id, name, brand, status FROM product
         WHERE primary_image_url IS NULL OR primary_image_url = ""
         ORDER BY status DESC, name LIMIT 100'
    );
    echo json_encode($stmt->fetchAll());
    exit;
}

// ── search_images ─────────────────────────────────────────────────────────────
if ($action === 'search_images') {
    $q   = trim($_GET['q'] ?? '');
    $src = $_GET['source'] ?? 'bing';
    if (!$q) { echo json_encode([]); exit; }

    $stmt = $pdo->prepare("SELECT setting_value FROM admin_settings WHERE setting_key = 'bing_api_key'");
    $stmt->execute();
    $bing_key = $stmt->fetchColumn();

    if ($src === 'bing' && $bing_key) {
        $url = 'https://api.bing.microsoft.com/v7.0/images/search?q=' . urlencode($q . ' phone official')
             . '&count=16&safeSearch=Moderate&imageType=Photo';
        $ctx = stream_context_create(['http' => [
            'header'  => 'Ocp-Apim-Subscription-Key: ' . $bing_key,
            'timeout' => 10,
        ]]);
        $resp = @file_get_contents($url, false, $ctx);
        if ($resp) {
            $data = json_decode($resp, true);
            $out  = [];
            foreach ($data['value'] ?? [] as $img) {
                $out[] = [
                    'url'       => $img['contentUrl'],
                    'thumbnail' => $img['thumbnailUrl'],
                    'source'    => parse_url($img['hostPageUrl'] ?? '', PHP_URL_HOST),
                    'name'      => $img['name'] ?? '',
                ];
            }
            echo json_encode($out);
            exit;
        }
    }
    // No key or fetch failed
    echo json_encode([['url' => 'https://www.gsmarena.com/search.php3?sQuickSearch=' . urlencode($q),
                        'thumbnail' => '', 'source' => 'GSMArena', 'name' => 'Open GSMArena to find image']]);
    exit;
}

// ── save_settings ─────────────────────────────────────────────────────────────
if ($action === 'save_settings') {
    // Handled by form POST in settings.php directly, but support AJAX too
    echo json_encode(['ok' => true]);
    exit;
}


// ── bulk_import_phones ────────────────────────────────────────────────────────
if ($action === 'bulk_import_phones') {
    if (empty($_FILES['json_files'])) {
        echo json_encode(['ok' => false, 'error' => 'No files uploaded']);
        exit;
    }

    // Parameter lookup for mapping
    $rows = $pdo->query('SELECT id, parameter FROM parameters WHERE type=1')->fetchAll();
    $param_lookup = [];
    foreach ($rows as $r) {
        $param_lookup[strtolower(trim($r['parameter']))] = $r['id'];
    }

    $gsmarena_map = [
        'type' => 'display type', 'size' => 'display size',
        'resolution' => 'display resolution', 'os' => 'os version',
        'chipset' => 'processor version', 'cpu' => 'processor',
        'gpu' => 'gpu', 'internal' => 'rom', 'card slot' => 'expandable storage',
        'capacity' => 'battery capacity', 'charging' => 'fast charging',
        'wlan' => 'wifi', 'bluetooth' => 'bluetooth', 'gps' => 'gps',
        'nfc' => 'nfc', 'usb' => 'usb', 'weight' => 'weight',
        'dimensions' => 'dimensions', 'build' => 'body build',
        'sim' => 'sim slots', 'announced' => 'launch date',
    ];

    function find_pid(string $key, array $lookup, array $map): ?int {
        $lower = strtolower(trim($key));
        if (isset($lookup[$lower])) return $lookup[$lower];
        if (isset($map[$lower]) && isset($lookup[$map[$lower]])) return $lookup[$map[$lower]];
        foreach ($lookup as $pname => $id) {
            if (strpos($pname, $lower) !== false || strpos($lower, $pname) !== false) return $id;
        }
        return null;
    }

    $results = [];
    $files = $_FILES['json_files'];
    $count = is_array($files['name']) ? count($files['name']) : 1;

    for ($i = 0; $i < $count; $i++) {
        $tmp  = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $fname = is_array($files['name']) ? $files['name'][$i] : $files['name'];
        if (!$tmp || !file_exists($tmp)) continue;

        $json = json_decode(file_get_contents($tmp), true);
        if (!$json || empty($json['name'])) {
            $results[] = ['file' => $fname, 'ok' => false, 'error' => 'Invalid JSON'];
            continue;
        }

        // Check duplicate
        $ex = $pdo->prepare('SELECT id FROM product WHERE name = :n');
        $ex->execute([':n' => $json['name']]);
        if ($ex->fetchColumn()) {
            $results[] = ['file' => $fname, 'ok' => false, 'name' => $json['name'], 'error' => 'Already exists'];
            continue;
        }

        // Insert product
        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $json['name']));
        $pdo->prepare(
            'INSERT INTO product (type, name, brand, slug, status, primary_image, primary_image_url, added, completion)
             VALUES (1, :name, :brand, :slug, 0, :img, :img2, NOW(), 0)'
        )->execute([
            ':name'  => $json['name'],
            ':brand' => $json['brand'] ?? '',
            ':slug'  => $slug,
            ':img'   => $json['image'] ?? '',
            ':img2'  => $json['image'] ?? '',
        ]);
        $pid = $pdo->lastInsertId();

        // Insert specs
        $ins = $pdo->prepare(
            'INSERT INTO specs (product, question, answer, speculated) VALUES (:pid,:q,:ans,1)'
        );
        $mapped = 0;
        foreach ($json['specs'] ?? [] as $section => $rows) {
            foreach ($rows as $row) {
                $param_id = find_pid($row['key'] ?? '', $param_lookup, $gsmarena_map);
                if ($param_id && !empty($row['val'])) {
                    try { $ins->execute([':pid'=>$pid,':q'=>$param_id,':ans'=>$row['val']]); $mapped++; }
                    catch (Exception $e) {}
                }
            }
        }

        $results[] = [
            'file'   => $fname,
            'ok'     => true,
            'name'   => $json['name'],
            'id'     => $pid,
            'mapped' => $mapped,
        ];
    }

    $ok_count   = count(array_filter($results, fn($r) => $r['ok']));
    $fail_count = count($results) - $ok_count;
    echo json_encode(['ok' => true, 'imported' => $ok_count, 'failed' => $fail_count, 'results' => $results]);
    exit;
}

// ── Unknown ───────────────────────────────────────────────────────────────────
http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'Unknown action: ' . htmlspecialchars($action)]);
