<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

// ================================================================
// TrustedSpecs API v1
// Endpoints:
//   GET  /phones               — paginated phone list with filters
//   GET  /phones/search?q=     — FULLTEXT search
//   GET  /phone/:slug          — single phone + specs + quality + prices
//   GET  /phone/:slug/similar  — phones in same price range
//   GET  /compare?ids=1,2,3    — side-by-side comparison data
//   GET  /budget?max=35000     — budget explorer with use-case filter
//   GET  /brands               — all brands with phone counts
//   GET  /articles             — paginated articles/news list
//   GET  /article/:slug        — single article
//   GET  /game/mystery         — today's mystery phone clues
//   GET  /stats                — homepage stats
//   POST /alert                — create price alert
//   POST /click                — track affiliate click
// ================================================================


// ── CORS ─────────────────────────────────────────────────────────
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = in_array($origin, ALLOWED_ORIGINS, true) ? $origin : ALLOWED_ORIGINS[0];
header("Access-Control-Allow-Origin: {$allowed}");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


// ── DATABASE ──────────────────────────────────────────────────────
function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET,
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    } catch (PDOException $e) {
        resp_error('Database connection failed', 500);
    }
    return $pdo;
}


// ── RESPONSE HELPERS ─────────────────────────────────────────────
function resp_ok(array $data, int $cache_secs = 0): never
{
    if ($cache_secs > 0) {
        header("Cache-Control: public, max-age={$cache_secs}");
    } else {
        header('Cache-Control: no-store');
    }
    http_response_code(200);
    echo json_encode(
        ['ok' => true, 'data' => $data],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK
    );
    exit;
}

function resp_error(string $msg, int $status = 400): never
{
    header('Cache-Control: no-store');
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function get_body(): array
{
    $raw = file_get_contents('php://input');
    return $raw ? (json_decode($raw, true) ?? []) : [];
}

function gp(string $key, mixed $default = ''): string
{
    $val = $_GET[$key] ?? $default;
    return trim(strip_tags((string)$val));
}

function gi(string $key, int $default = 0): int
{
    return isset($_GET[$key]) ? (int)$_GET[$key] : $default;
}

function placeholders(array $arr): string
{
    return implode(',', array_fill(0, count($arr), '?'));
}

// ── ROUTER ───────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$base   = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$path   = trim(substr($uri, strlen($base)), '/');
$parts  = $path === '' ? [] : explode('/', $path);
$s      = fn(int $i): string => $parts[$i] ?? '';

try {
    match (true) {
        // ── Phones
        $method === 'GET' && $s(0) === 'phones' && $s(1) === 'search' => phones_search(),
        $method === 'GET' && $s(0) === 'phones' && $s(1) === ''       => phones_list(),

        // ── Single phone
        $method === 'GET' && $s(0) === 'phone' && $s(1) !== '' && $s(2) === 'similar' => phone_similar($s(1)),
        $method === 'GET' && $s(0) === 'phone' && $s(1) !== '' && $s(2) === ''        => phone_detail($s(1)),

        // ── Compare
        $method === 'GET' && $s(0) === 'compare' => compare(),

        // ── Budget explorer
        $method === 'GET' && $s(0) === 'budget'  => budget(),

        // ── Brands
        $method === 'GET' && $s(0) === 'brands'  => brands(),

        // ── Articles
        $method === 'GET' && $s(0) === 'articles' && $s(1) === '' => articles_list(),
        $method === 'GET' && $s(0) === 'article'  && $s(1) !== '' => article_detail($s(1)),

        // ── Games
        $method === 'GET' && $s(0) === 'game' && $s(1) === 'mystery' => game_mystery(),

        // ── Stats
        $method === 'GET' && $s(0) === 'stats' => stats(),

        // ── Actions (POST)
        $method === 'POST' && $s(0) === 'alert' => alert_create(),
        $method === 'POST' && $s(0) === 'click' => click_track(),

        default => resp_error('Endpoint not found', 404),
    };
} catch (PDOException $e) {
    resp_error('DB error: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
    resp_error('Server error: ' . $e->getMessage(), 500);
}


// ================================================================
// HANDLERS
// ================================================================


// ── GET /phones ───────────────────────────────────────────────────
// Filters: brand, min, max, discontinued, sort, page, limit
function phones_list(): void
{
    $pdo   = db();
    $where = ['p.status = 1'];
    $bind  = [];

    $brand = gp('brand');
    if ($brand !== '') { $where[] = 'p.brand = ?'; $bind[] = $brand; }

    $min = gi('min');
    if ($min > 0) { $where[] = 'p.launch_price >= ?'; $bind[] = $min; }

    $max = gi('max');
    if ($max > 0) { $where[] = 'p.launch_price > 0 AND p.launch_price <= ?'; $bind[] = $max; }

    if (gp('discontinued') !== '') {
        $where[] = 'p.is_discontinued = ?';
        $bind[]  = gi('discontinued');
    }

    $wc = implode(' AND ', $where);

    $sort = match (gp('sort', 'default')) {
        'price_asc'  => 'p.launch_price ASC',
        'price_desc' => 'p.launch_price DESC',
        'newest'     => 'p.added DESC',
        'views'      => 'p.views DESC',
        'name'       => 'p.name ASC',
        default      => 'p.completion DESC, p.added DESC',
    };

    $limit  = min(gi('limit', 20), MAX_PAGE_SIZE);
    $page   = gi('page', 0);
    $offset = $page * $limit;

    $stmt = $pdo->prepare(
        "SELECT p.id, p.name, p.brand, p.slug, p.launch_price, p.release_date,
                p.is_discontinued, p.primary_image, p.completion, p.views
         FROM product p
         WHERE {$wc}
         ORDER BY {$sort}
         LIMIT ? OFFSET ?"
    );
    $stmt->execute([...$bind, $limit, $offset]);
    $phones = $stmt->fetchAll();

    $count = $pdo->prepare("SELECT COUNT(*) FROM product p WHERE {$wc}");
    $count->execute($bind);

    resp_ok([
        'phones' => $phones,
        'total'  => (int) $count->fetchColumn(),
        'page'   => $page,
        'limit'  => $limit,
    ], CACHE_SHORT);
}


// ── GET /phones/search?q= ─────────────────────────────────────────
function phones_search(): void
{
    $q = gp('q');
    if (strlen($q) < 2) resp_error('Query too short — min 2 characters');

    $pdo   = db();
    $limit = min(gi('limit', 10), 20);

    // FULLTEXT search using the ts_product_fulltext index
    $stmt = $pdo->prepare(
        "SELECT p.id, p.name, p.brand, p.slug, p.launch_price,
                p.primary_image, p.completion, p.is_discontinued,
                MATCH(p.name, p.brand) AGAINST(? IN BOOLEAN MODE) AS relevance
         FROM product p
         WHERE p.status = 1
           AND MATCH(p.name, p.brand) AGAINST(? IN BOOLEAN MODE)
         ORDER BY relevance DESC, p.completion DESC
         LIMIT ?"
    );
    $stmt->execute([$q . '*', $q . '*', $limit]);
    $results = $stmt->fetchAll();

    // Fallback to LIKE if FULLTEXT returns nothing (short queries)
    if (empty($results)) {
        $like = "%{$q}%";
        $stmt = $pdo->prepare(
            "SELECT id, name, brand, slug, launch_price, primary_image,
                    completion, is_discontinued
             FROM product
             WHERE status = 1
               AND (name LIKE ? OR brand LIKE ?)
             ORDER BY completion DESC
             LIMIT ?"
        );
        $stmt->execute([$like, $like, $limit]);
        $results = $stmt->fetchAll();
    }

    resp_ok(['results' => $results, 'query' => $q], CACHE_SHORT);
}


// ── GET /phone/:slug ──────────────────────────────────────────────
function phone_detail(string $slug): void
{
    $pdo = db();

    // Fetch product
    $stmt = $pdo->prepare(
        "SELECT * FROM product WHERE slug = ? AND status = 1 LIMIT 1"
    );
    $stmt->execute([$slug]);
    $phone = $stmt->fetch();

    if (!$phone) resp_error('Phone not found', 404);

    // Increment views (fire-and-forget)
    $pdo->prepare("UPDATE product SET views = views + 1 WHERE id = ?")->execute([$phone['id']]);

    // All specs grouped by category
    $specs_stmt = $pdo->prepare(
        "SELECT par.category, par.parameter, par.answer_type, par.options,
                par.sequence, s.answer, s.speculated
         FROM specs s
         JOIN parameters par ON s.question = par.id
         WHERE s.product = ?
           AND s.answer != ''
         ORDER BY par.category, par.sequence"
    );
    $specs_stmt->execute([$phone['id']]);
    $specs = [];
    foreach ($specs_stmt->fetchAll() as $row) {
        $specs[$row['category']][] = [
            'parameter'   => $row['parameter'],
            'answer'      => $row['answer'],
            'answer_type' => (int) $row['answer_type'],
            'speculated'  => (bool) $row['speculated'],
        ];
    }

    // Quality scores
    $q_stmt = $pdo->prepare(
        "SELECT category, specs, review, cs, confidence, review_count,
                last_reviewed, reviewer_notes, sources
         FROM scores WHERE product = ?"
    );
    $q_stmt->execute([$phone['id']]);
    $quality = [];
    foreach ($q_stmt->fetchAll() as $row) {
        if ($row['sources']) {
            $row['sources'] = json_decode($row['sources'], true);
        }
        $quality[$row['category']] = $row;
    }

    // Latest price per source
    $price_stmt = $pdo->prepare(
        "SELECT source, price, original_price, affiliate_url, in_stock, recorded_at
         FROM price_history
         WHERE product_id = ?
           AND recorded_at >= (
               SELECT MAX(recorded_at) FROM price_history p2
               WHERE p2.product_id = price_history.product_id
                 AND p2.source = price_history.source
           )
         ORDER BY price ASC"
    );
    $price_stmt->execute([$phone['id']]);
    $prices = $price_stmt->fetchAll();

    // Media
    $media_stmt = $pdo->prepare(
        "SELECT url, caption, description, m_type FROM media WHERE product = ? ORDER BY id ASC"
    );
    $media_stmt->execute([$phone['id']]);

    // Variants
    $var_stmt = $pdo->prepare(
        "SELECT ram, storage, color, label, launch_price, current_price, is_available
         FROM product_variants WHERE product_id = ? ORDER BY ram ASC, storage ASC"
    );
    $var_stmt->execute([$phone['id']]);

    // Predecessor / Successor names
    $related = [];
    foreach (['predecessor_id' => 'predecessor', 'successor_id' => 'successor'] as $col => $key) {
        if (!empty($phone[$col])) {
            $r = $pdo->prepare("SELECT id, name, slug, launch_price FROM product WHERE id = ? LIMIT 1");
            $r->execute([$phone[$col]]);
            $related[$key] = $r->fetch() ?: null;
        }
    }

    resp_ok([
        'phone'    => $phone,
        'specs'    => $specs,
        'quality'  => $quality,
        'prices'   => $prices,
        'media'    => $media_stmt->fetchAll(),
        'variants' => $var_stmt->fetchAll(),
        'related'  => $related,
    ], CACHE_MEDIUM);
}


// ── GET /phone/:slug/similar ──────────────────────────────────────
function phone_similar(string $slug): void
{
    $pdo = db();

    $stmt = $pdo->prepare(
        "SELECT id, launch_price, brand FROM product WHERE slug = ? AND status = 1 LIMIT 1"
    );
    $stmt->execute([$slug]);
    $phone = $stmt->fetch();

    if (!$phone) resp_error('Phone not found', 404);

    $margin = max(5000, (int) ($phone['launch_price'] * 0.30)); // 30% price range
    $min    = max(0, $phone['launch_price'] - $margin);
    $max    = $phone['launch_price'] + $margin;

    $sim = $pdo->prepare(
        "SELECT p.id, p.name, p.brand, p.slug, p.launch_price,
                p.primary_image, p.completion,
                COALESCE(AVG(s.cs), 0) AS avg_score
         FROM product p
         LEFT JOIN scores s ON s.product = p.id
         WHERE p.status = 1
           AND p.id != ?
           AND p.launch_price BETWEEN ? AND ?
           AND p.launch_price > 0
         GROUP BY p.id
         ORDER BY avg_score DESC, p.completion DESC
         LIMIT 6"
    );
    $sim->execute([$phone['id'], $min, $max]);

    resp_ok(['similar' => $sim->fetchAll()], CACHE_MEDIUM);
}


// ── GET /compare?ids=1,2,3 ────────────────────────────────────────
function compare(): void
{
    $pdo     = db();
    $raw_ids = gp('ids');

    if ($raw_ids === '') resp_error('ids parameter required');

    $ids = array_unique(array_filter(array_map('intval', explode(',', $raw_ids))));
    $ids = array_slice($ids, 0, 3);

    if (empty($ids)) resp_error('No valid phone IDs');

    $ph = placeholders($ids);

    // Phones basic info
    $stmt = $pdo->prepare(
        "SELECT id, name, brand, slug, launch_price, release_date,
                primary_image, affiliate_amazon, affiliate_flipkart,
                affiliate_croma, is_discontinued, completion
         FROM product WHERE id IN ({$ph}) AND status = 1"
    );
    $stmt->execute($ids);
    $phones = $stmt->fetchAll();

    if (empty($phones)) resp_error('No phones found');

    // All specs for all phones
    $sp = $pdo->prepare(
        "SELECT s.product, par.category, par.parameter, par.sequence,
                par.answer_type, s.answer, s.speculated
         FROM specs s
         JOIN parameters par ON s.question = par.id
         WHERE s.product IN ({$ph})
           AND s.answer != ''
         ORDER BY par.category, par.sequence"
    );
    $sp->execute($ids);
    $specs = [];
    foreach ($sp->fetchAll() as $row) {
        $specs[$row['product']][$row['category']][$row['parameter']] = [
            'answer'     => $row['answer'],
            'speculated' => (bool) $row['speculated'],
            'answer_type'=> (int)  $row['answer_type'],
        ];
    }

    // Quality scores
    $qs = $pdo->prepare(
        "SELECT product, category, specs AS specs_score, review, cs,
                confidence, review_count, reviewer_notes
         FROM scores WHERE product IN ({$ph})"
    );
    $qs->execute($ids);
    $quality = [];
    foreach ($qs->fetchAll() as $row) {
        $quality[$row['product']][$row['category']] = $row;
    }

    // Latest prices
    $pr = $pdo->prepare(
        "SELECT product_id, source, price, affiliate_url, in_stock
         FROM price_history ph
         WHERE product_id IN ({$ph})
           AND recorded_at = (
               SELECT MAX(recorded_at) FROM price_history ph2
               WHERE ph2.product_id = ph.product_id
                 AND ph2.source = ph.source
           )"
    );
    $pr->execute($ids);
    $prices = [];
    foreach ($pr->fetchAll() as $row) {
        $prices[$row['product_id']][$row['source']] = $row;
    }

    // Build shareable slug and save
    sort($ids);
    $comp_slug = implode('-vs-', array_map(
        fn($id) => array_column($phones, 'slug', 'id')[$id] ?? $id,
        $ids
    ));
    $pdo->prepare(
        "INSERT INTO saved_comparisons (slug, product_ids, views)
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE views = views + 1"
    )->execute([$comp_slug, implode(',', $ids)]);

    resp_ok([
        'phones'       => $phones,
        'specs'        => $specs,
        'quality'      => $quality,
        'prices'       => $prices,
        'share_slug'   => $comp_slug,
    ], CACHE_SHORT);
}


// ── GET /budget?max=35000&usecase=gaming&limit=12 ─────────────────
function budget(): void
{
    $pdo     = db();
    $max     = gi('max', 30000);
    $usecase = gp('usecase', 'all');
    $limit   = min(gi('limit', 12), 30);

    $where = ['p.status = 1', 'p.launch_price > 0', 'p.launch_price <= ?', 'p.is_discontinued = 0'];
    $bind  = [$max];

    // Use-case filtering via Tags specs
    // Tags category has parameters: Gaming, Photography, Battery Life, Value For Money etc.
    // Answers: Good, Average, Below Average, Bad
    $tagMap = [
        'gaming'      => 'Gaming',
        'photography' => 'Photography',
        'battery'     => 'Battery Life',
        'value'       => 'Value For Money',
        'camera'      => 'Photography',
    ];

    if ($usecase !== 'all' && isset($tagMap[$usecase])) {
        $where[] = "EXISTS (
            SELECT 1 FROM specs s
            JOIN parameters par ON s.question = par.id
            WHERE s.product = p.id
              AND par.category = 'Tags'
              AND par.parameter = ?
              AND s.answer = 'Good'
        )";
        $bind[] = $tagMap[$usecase];
    }

    $wc   = implode(' AND ', $where);
    $stmt = $pdo->prepare(
        "SELECT p.id, p.name, p.brand, p.slug, p.launch_price,
                p.primary_image, p.completion, p.release_date,
                COALESCE(AVG(sc.cs), 0) AS avg_score
         FROM product p
         LEFT JOIN scores sc ON sc.product = p.id
         WHERE {$wc}
         GROUP BY p.id
         ORDER BY avg_score DESC, p.completion DESC
         LIMIT ?"
    );
    $stmt->execute([...$bind, $limit]);

    resp_ok([
        'phones'  => $stmt->fetchAll(),
        'max'     => $max,
        'usecase' => $usecase,
    ], CACHE_SHORT);
}


// ── GET /brands ───────────────────────────────────────────────────
function brands(): void
{
    $pdo  = db();
    $stmt = $pdo->query(
        "SELECT brand, COUNT(*) AS phone_count,
                SUM(CASE WHEN is_discontinued = 0 THEN 1 ELSE 0 END) AS active_count
         FROM product
         WHERE status = 1
         GROUP BY brand
         ORDER BY phone_count DESC"
    );
    resp_ok(['brands' => $stmt->fetchAll()], CACHE_LONG);
}


// ── GET /articles?type=news&page=0 ───────────────────────────────
function articles_list(): void
{
    $pdo   = db();
    $where = ['a.status = 1'];
    $bind  = [];

    $type = gp('type');
    if ($type !== '') { $where[] = 'a.type = ?'; $bind[] = $type; }

    $wc     = implode(' AND ', $where);
    $limit  = min(gi('limit', 12), 30);
    $page   = gi('page', 0);
    $offset = $page * $limit;

    $stmt = $pdo->prepare(
        "SELECT a.id, a.type, a.title, a.slug, a.excerpt, a.cover_image,
                a.author, a.views, a.read_time_mins, a.published_at, a.related_products
         FROM articles a
         WHERE {$wc}
         ORDER BY a.published_at DESC
         LIMIT ? OFFSET ?"
    );
    $stmt->execute([...$bind, $limit, $offset]);

    $count = $pdo->prepare("SELECT COUNT(*) FROM articles a WHERE {$wc}");
    $count->execute($bind);

    resp_ok([
        'articles' => $stmt->fetchAll(),
        'total'    => (int) $count->fetchColumn(),
        'page'     => $page,
        'limit'    => $limit,
    ], CACHE_SHORT);
}


// ── GET /article/:slug ───────────────────────────────────────────
function article_detail(string $slug): void
{
    $pdo  = db();
    $stmt = $pdo->prepare(
        "SELECT * FROM articles WHERE slug = ? AND status = 1 LIMIT 1"
    );
    $stmt->execute([$slug]);
    $article = $stmt->fetch();

    if (!$article) resp_error('Article not found', 404);

    $pdo->prepare("UPDATE articles SET views = views + 1 WHERE id = ?")->execute([$article['id']]);

    // Fetch related phones if any
    $related_phones = [];
    if (!empty($article['related_products'])) {
        $ids = array_filter(array_map('intval', explode(',', $article['related_products'])));
        if ($ids) {
            $ph   = placeholders($ids);
            $stmt = $pdo->prepare(
                "SELECT id, name, brand, slug, launch_price, primary_image
                 FROM product WHERE id IN ({$ph})"
            );
            $stmt->execute($ids);
            $related_phones = $stmt->fetchAll();
        }
    }

    resp_ok(['article' => $article, 'related_phones' => $related_phones], CACHE_MEDIUM);
}


// ── GET /game/mystery ─────────────────────────────────────────────
// Returns clue-by-clue data for today's mystery phone.
// The actual phone name is never sent until clue count = 4.
function game_mystery(): void
{
    $pdo = db();

    // Pick today's mystery phone deterministically from seed
    $seed = crc32(date('Y-m-d') . MYSTERY_SALT);
    $stmt = $pdo->query("SELECT COUNT(*) FROM product WHERE status = 1 AND completion >= 70");
    $total = (int) $stmt->fetchColumn();

    if ($total === 0) resp_error('No phones available for game');

    $offset = abs($seed) % $total;

    $phone_stmt = $pdo->prepare(
        "SELECT p.id, p.name, p.brand, p.slug, p.launch_price, p.primary_image
         FROM product p
         WHERE p.status = 1 AND p.completion >= 70
         ORDER BY p.id ASC
         LIMIT 1 OFFSET ?"
    );
    $phone_stmt->execute([$offset]);
    $phone = $phone_stmt->fetch();

    if (!$phone) resp_error('Game unavailable');

    // Get specific clues (Display, Chipset, Battery, Price, Brand)
    $clue_params = ['Display Type', 'Processor Version', 'Battery Size', 'Loudspeaker'];
    $ph          = placeholders($clue_params);
    $clue_stmt   = $pdo->prepare(
        "SELECT par.parameter AS label, s.answer
         FROM specs s
         JOIN parameters par ON s.question = par.id
         WHERE s.product = ?
           AND par.parameter IN ({$ph})
           AND s.answer != ''
         ORDER BY par.sequence"
    );
    $clue_stmt->execute([$phone['id'], ...$clue_params]);
    $spec_clues = $clue_stmt->fetchAll();

    // Build clues array — price and brand are last reveals
    $clues = array_map(fn($r) => [
        'label'  => $r['label'],
        'value'  => $r['answer'],
        'reveal' => false, // frontend reveals one at a time
    ], $spec_clues);

    $clues[] = ['label' => 'Launch Price', 'value' => '₹' . number_format($phone['launch_price']), 'reveal' => false];
    $clues[] = ['label' => 'Brand',        'value' => $phone['brand'],                              'reveal' => false];

    $reveal = gi('reveal', 0); // how many clues the user wants revealed
    $reveal = min($reveal, count($clues));

    $clues_out = [];
    foreach ($clues as $i => $clue) {
        $clues_out[] = $i < $reveal
            ? array_merge($clue, ['reveal' => true])
            : ['label' => $clue['label'], 'value' => '???', 'reveal' => false];
    }

    // Only reveal answer when all clues shown
    $answer = $reveal >= count($clues) ? [
        'name'  => $phone['name'],
        'slug'  => $phone['slug'],
        'image' => $phone['primary_image'],
    ] : null;

    resp_ok([
        'clues'       => $clues_out,
        'total_clues' => count($clues),
        'revealed'    => $reveal,
        'answer'      => $answer,
        'date'        => date('Y-m-d'),
    ], 60); // 1 min cache
}


// ── GET /stats ────────────────────────────────────────────────────
function stats(): void
{
    $pdo = db();

    $phones_total = (int) $pdo->query("SELECT COUNT(*) FROM product WHERE status = 1")->fetchColumn();
    $brands_total = (int) $pdo->query("SELECT COUNT(DISTINCT brand) FROM product WHERE status = 1")->fetchColumn();
    $specs_total  = (int) $pdo->query("SELECT COUNT(*) FROM specs")->fetchColumn();
    $alerts_total = (int) $pdo->query("SELECT COUNT(*) FROM price_alerts WHERE triggered = 0")->fetchColumn();

    // Top 4 phones by views
    $trending = $pdo->query(
        "SELECT id, name, brand, slug, launch_price, primary_image, views
         FROM product WHERE status = 1 ORDER BY views DESC LIMIT 4"
    )->fetchAll();

    // Recent articles
    $news = $pdo->query(
        "SELECT type, title, slug, excerpt, published_at, read_time_mins
         FROM articles WHERE status = 1 ORDER BY published_at DESC LIMIT 3"
    )->fetchAll();

    resp_ok([
        'phones'    => $phones_total,
        'brands'    => $brands_total,
        'specs'     => $specs_total,
        'alerts'    => $alerts_total,
        'trending'  => $trending,
        'news'      => $news,
    ], CACHE_SHORT);
}


// ── POST /alert ───────────────────────────────────────────────────
function alert_create(): void
{
    $body = get_body();

    $product_id   = (int) ($body['product_id']   ?? 0);
    $email        = trim($body['email']           ?? '');
    $target_price = (int) ($body['target_price']  ?? 0);
    $whatsapp     = trim($body['whatsapp']        ?? '');
    $source       = trim($body['source']          ?? 'any');

    if (!$product_id)                    resp_error('product_id required');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) resp_error('Valid email required');
    if ($target_price < 1000)            resp_error('target_price must be at least 1000');

    $allowed_sources = ['amazon', 'flipkart', 'croma', 'any'];
    if (!in_array($source, $allowed_sources, true)) $source = 'any';

    $pdo = db();

    // Verify phone exists
    $chk = $pdo->prepare("SELECT id FROM product WHERE id = ? AND status = 1 LIMIT 1");
    $chk->execute([$product_id]);
    if (!$chk->fetch()) resp_error('Phone not found', 404);

    // Check for existing alert
    $exists = $pdo->prepare(
        "SELECT id FROM price_alerts WHERE product_id = ? AND email = ? AND triggered = 0 LIMIT 1"
    );
    $exists->execute([$product_id, $email]);
    if ($exists->fetch()) resp_error('You already have an active alert for this phone');

    $token = bin2hex(random_bytes(20));

    $stmt = $pdo->prepare(
        "INSERT INTO price_alerts
         (product_id, email, whatsapp, target_price, source, verify_token, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())"
    );
    $stmt->execute([$product_id, $email, $whatsapp, $target_price, $source, $token]);

    // TODO: send verification email via Brevo API using $token
    // Verification URL: https://trustedspecs.com/verify-alert?token=$token

    resp_ok([
        'message' => 'Alert created — check your email to verify',
        'email'   => $email,
    ]);
}


// ── POST /click ───────────────────────────────────────────────────
function click_track(): void
{
    $body = get_body();

    $product_id = (int) ($body['product_id'] ?? 0);
    $source     = trim($body['source']       ?? 'other');
    $page_type  = trim($body['page_type']    ?? '');

    if (!$product_id) resp_error('product_id required');

    $allowed_sources = ['amazon', 'flipkart', 'croma', 'tata_cliq', 'reliance_digital', 'other'];
    if (!in_array($source, $allowed_sources, true)) $source = 'other';

    $ip_hash  = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');
    $ref_page = substr($_SERVER['HTTP_REFERER'] ?? '', 0, 300);

    $pdo = db();
    $pdo->prepare(
        "INSERT INTO affiliate_clicks (product_id, source, page_type, ip_hash, ref_page, clicked_at)
         VALUES (?, ?, ?, ?, ?, NOW())"
    )->execute([$product_id, $source, $page_type, $ip_hash, $ref_page]);

    // Return the actual affiliate URL for redirect
    $url_col = match($source) {
        'amazon'   => 'affiliate_amazon',
        'flipkart' => 'affiliate_flipkart',
        'croma'    => 'affiliate_croma',
        default    => null,
    };

    $redirect_url = null;
    if ($url_col) {
        $stmt = $pdo->prepare("SELECT {$url_col} AS url FROM product WHERE id = ? LIMIT 1");
        $stmt->execute([$product_id]);
        $row = $stmt->fetch();
        $redirect_url = $row['url'] ?: null;
    }

    resp_ok(['redirect' => $redirect_url]);
}
