<?php
// pages/news-fetcher.php
$feeds = [
    '91mobiles'  => 'https://www.91mobiles.com/feed/',
    'GSMArena'   => 'https://www.gsmarena.com/rss-news-reviews.php3',
    'Gadgets 360'=> 'https://gadgets.ndtv.com/rss/feeds',
    'Digit.in'   => 'https://www.digit.in/rss.xml',
    'BGR India'  => 'https://www.bgr.in/feed/',
    'MySmartPrice'=>'https://www.mysmartprice.com/gear/feed/',
];

$fetch_results = [];
$import_msg = '';

// Handle single article import
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['import_article'])) {
    $title   = trim($_POST['imp_title']  ?? '');
    $excerpt = trim($_POST['imp_excerpt']?? '');
    $content = '<p>' . htmlspecialchars(trim($_POST['imp_content'] ?? '')) . '</p>';
    $src_url = trim($_POST['imp_url']    ?? '');
    $source  = trim($_POST['imp_source'] ?? '');

    if ($title) {
        $slug = strtolower(preg_replace('/[^a-z0-9]+/i','-', $title));
        // Add source credit to content
        $content .= "\n<div class=\"ts-callout ts-callout-info\">📰 Source: <a href=\"" . htmlspecialchars($src_url) . "\" target=\"_blank\" rel=\"noopener\">" . htmlspecialchars($source) . "</a></div>";
        try {
            $pdo->prepare(
                'INSERT INTO articles (title,slug,type,status,excerpt,content,created_at,updated_at)
                 VALUES (:title,:slug,:type,:status,:excerpt,:content,NOW(),NOW())'
            )->execute([
                ':title'=>$title,':slug'=>$slug,':type'=>'news',
                ':status'=>'draft',':excerpt'=>$excerpt,':content'=>$content
            ]);
            $import_msg = 'Imported "' . htmlspecialchars($title) . '" as draft.';
        } catch (PDOException $e) {
            $import_msg = 'Error: ' . $e->getMessage();
        }
    }
}

// Fetch selected feed
$active_feed = $_GET['feed'] ?? '';
$feed_items  = [];
$feed_error  = '';

if ($active_feed && isset($feeds[$active_feed])) {
    $url = $feeds[$active_feed];
    $ctx = stream_context_create(['http'=>['timeout'=>10,'user_agent'=>'Mozilla/5.0 TrustedSpecs-News-Fetcher/1.0']]);
    $xml_str = @file_get_contents($url, false, $ctx);
    if ($xml_str === false) {
        $feed_error = 'Could not fetch feed. The site may block automated requests. Try another source.';
    } else {
        $xml = @simplexml_load_string($xml_str, 'SimpleXMLElement', LIBXML_NOCDATA);
        if (!$xml) {
            $feed_error = 'Invalid feed format.';
        } else {
            $items = $xml->channel->item ?? $xml->entry ?? [];
            foreach ($items as $item) {
                $title   = (string)($item->title ?? '');
                $link    = (string)($item->link  ?? $item->id ?? '');
                $date    = (string)($item->pubDate ?? $item->updated ?? '');
                $desc    = (string)($item->description ?? $item->summary ?? '');
                $desc    = strip_tags($desc);
                $desc    = mb_substr(trim($desc), 0, 280);
                if ($title) {
                    $feed_items[] = [
                        'title'   => $title,
                        'link'    => $link,
                        'date'    => $date ? date('d M Y', strtotime($date)) : '',
                        'excerpt' => $desc,
                        'source'  => $active_feed,
                    ];
                }
            }
        }
    }
}
?>

<div class="card mb-2">
  <div class="card-header">
    <h2>News Sources (RSS)</h2>
    <span class="text-xs text-muted">Click a source to fetch headlines</span>
  </div>
  <div class="card-body" style="display:flex;flex-wrap:wrap;gap:.5rem">
    <?php foreach ($feeds as $name => $url): ?>
      <a href="index.php?page=news-fetcher&feed=<?= urlencode($name) ?>"
         class="btn <?= $active_feed===$name?'btn-primary':'btn-secondary' ?>">
        <?= htmlspecialchars($name) ?>
      </a>
    <?php endforeach; ?>
  </div>
</div>

<?php if ($import_msg): ?>
<div class="alert <?= str_starts_with($import_msg,'Error')?'alert-error':'alert-success' ?>"><?= htmlspecialchars($import_msg) ?></div>
<?php endif; ?>

<?php if ($feed_error): ?>
<div class="alert alert-error"><?= htmlspecialchars($feed_error) ?></div>
<?php endif; ?>

<?php if (!empty($feed_items)): ?>
<div class="card card-body-flush">
  <div class="card-header">
    <h2><?= htmlspecialchars($active_feed) ?> — <?= count($feed_items) ?> articles</h2>
  </div>
  <?php foreach ($feed_items as $item): ?>
  <div class="rss-item">
    <div>
      <div class="rss-title"><?= htmlspecialchars($item['title']) ?></div>
      <div class="rss-meta">
        <span class="rss-source"><?= htmlspecialchars($item['source']) ?></span>
        <?php if ($item['date']): ?> · <?= htmlspecialchars($item['date']) ?><?php endif; ?>
      </div>
      <?php if ($item['excerpt']): ?>
        <div class="text-sm text-muted mt-1"><?= htmlspecialchars($item['excerpt']) ?></div>
      <?php endif; ?>
    </div>
    <div style="flex-shrink:0">
      <a href="<?= htmlspecialchars($item['link']) ?>" target="_blank" class="btn btn-sm btn-secondary">Read ↗</a>
      <form method="POST" action="" style="display:inline">
        <input type="hidden" name="imp_title"   value="<?= htmlspecialchars($item['title']) ?>">
        <input type="hidden" name="imp_excerpt" value="<?= htmlspecialchars($item['excerpt']) ?>">
        <input type="hidden" name="imp_content" value="<?= htmlspecialchars($item['excerpt']) ?>">
        <input type="hidden" name="imp_url"     value="<?= htmlspecialchars($item['link']) ?>">
        <input type="hidden" name="imp_source"  value="<?= htmlspecialchars($item['source']) ?>">
        <button type="submit" name="import_article" class="btn btn-sm btn-success">+ Draft</button>
      </form>
    </div>
  </div>
  <?php endforeach; ?>
</div>
<?php elseif (!$active_feed): ?>
<div class="card">
  <div class="card-body">
    <div class="empty-state">
      <svg viewBox="0 0 48 48"><path d="M8 12h32v4H8zm0 8h24v4H8zm0 8h16v4H8z"/></svg>
      Select a news source above to fetch headlines.
    </div>
  </div>
</div>
<?php endif; ?>
