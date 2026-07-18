<?php
// cron/price_tracker.php
// Run: 0 */6 * * * /usr/bin/php /path/to/cron/price_tracker.php >> /tmp/ts_price_tracker.log 2>&1
// Fetches real-time prices from Amazon PA-API and Flipkart Affiliate API
// and inserts new rows into the pricing table.

define('CRON', true);
chdir(dirname(__DIR__)); // go up to admin root

require_once 'cron_db.php'; // shared DB connection

// Load settings
$settings = [];
$rows = $pdo->query('SELECT setting_key,setting_value FROM admin_settings')->fetchAll();
foreach ($rows as $r) $settings[$r['setting_key']] = $r['setting_value'];

$log = function($msg) { echo '[' . date('Y-m-d H:i:s') . '] ' . $msg . PHP_EOL; };

// ── Amazon PA-API ─────────────────────────────────────────────────────────────
function amazon_get_price($asin, $settings) {
    $access_key  = $settings['amazon_pa_api_key'] ?? '';
    $secret_key  = $settings['amazon_pa_secret'] ?? '';
    $partner_tag = $settings['amazon_associate_tag'] ?? '';
    $host        = 'webservices.amazon.in';
    $region      = 'eu-west-1';

    if (!$access_key || !$secret_key || !$partner_tag || !$asin) return null;

    $payload = json_encode([
        'ItemIds'    => [$asin],
        'Resources'  => ['Offers.Listings.Price','Offers.Listings.Availability.Message'],
        'PartnerTag' => $partner_tag,
        'PartnerType'=> 'Associates',
        'Marketplace'=> 'www.amazon.in',
    ]);

    // AWS Signature v4
    $datetime = gmdate('Ymd\THis\Z');
    $date     = gmdate('Ymd');
    $service  = 'ProductAdvertisingAPI';
    $path     = '/paapi5/getitems';

    $canonical = "POST\n$path\n\ncontent-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\n"
                ."host:$host\nx-amz-date:$datetime\nx-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems\n\n"
                ."content-encoding;content-type;host;x-amz-date;x-amz-target\n"
                .hash('sha256', $payload);

    $string_to_sign = "AWS4-HMAC-SHA256\n$datetime\n$date/$region/$service/aws4_request\n".hash('sha256',$canonical);

    $signing_key = hash_hmac('sha256','aws4_request',
        hash_hmac('sha256',$service,
            hash_hmac('sha256',$region,
                hash_hmac('sha256',$date,'AWS4'.$secret_key,true),true),true),true);
    $signature = hash_hmac('sha256',$string_to_sign,$signing_key);

    $auth = "AWS4-HMAC-SHA256 Credential=$access_key/$date/$region/$service/aws4_request, "
           ."SignedHeaders=content-encoding;content-type;host;x-amz-date;x-amz-target, Signature=$signature";

    $ctx = stream_context_create(['http'=>[
        'method'  => 'POST',
        'header'  => "Content-Type: application/json; charset=utf-8\r\n"
                    ."Content-Encoding: amz-1.0\r\n"
                    ."X-Amz-Date: $datetime\r\n"
                    ."X-Amz-Target: com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems\r\n"
                    ."Authorization: $auth\r\n",
        'content' => $payload,
        'timeout' => 10,
    ]]);

    $resp = @file_get_contents("https://$host$path", false, $ctx);
    if (!$resp) return null;
    $data = json_decode($resp, true);
    $items = $data['ItemsResult']['Items'] ?? [];
    if (empty($items)) return null;
    $offers = $items[0]['Offers']['Listings'] ?? [];
    if (empty($offers)) return null;
    $price = $offers[0]['Price']['Amount'] ?? null;
    $in_stock = !empty($offers[0]['Availability']['Message'])
        && stripos($offers[0]['Availability']['Message'], 'stock') !== false;
    return $price ? ['price' => $price, 'in_stock' => $in_stock ? 1 : 0] : null;
}

// Get phones with Amazon affiliate URLs containing ASINs
$phones = $pdo->query(
    "SELECT id, name, affiliate_amazon, affiliate_flipkart FROM product
     WHERE status=1 AND (affiliate_amazon != '' OR affiliate_flipkart != '')
     ORDER BY RAND() LIMIT 50"
)->fetchAll(); // limit 50 per run to stay within API quotas

$updated = 0;
foreach ($phones as $phone) {
    // Extract ASIN from Amazon URL
    if ($phone['affiliate_amazon']) {
        preg_match('/\/([A-Z0-9]{10})(?:[\/\?]|$)/', $phone['affiliate_amazon'], $m);
        $asin = $m[1] ?? null;
        if ($asin) {
            $result = amazon_get_price($asin, $settings);
            if ($result) {
                $pdo->prepare(
                    'INSERT INTO pricing (product_id,source,price_inr,in_stock,affiliate_url,recorded_at)
                     VALUES (:pid,:src,:price,:stock,:url,NOW())'
                )->execute([
                    ':pid'  => $phone['id'],
                    ':src'  => 'Amazon',
                    ':price'=> $result['price'],
                    ':stock'=> $result['in_stock'],
                    ':url'  => $phone['affiliate_amazon'],
                ]);
                $updated++;
                $log("Updated Amazon price for #{$phone['id']} {$phone['name']}: ₹{$result['price']}");
            }
        }
    }
    usleep(200000); // 200ms between calls
}

$log("Price tracker done. Updated $updated entries.");
