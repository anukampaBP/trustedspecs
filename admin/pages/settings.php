<?php
// pages/settings.php
$settings = [];
try {
    $stmt = $pdo->query('SELECT setting_key,setting_value FROM admin_settings');
    foreach ($stmt->fetchAll() as $row) $settings[$row['setting_key']] = $row['setting_value'];
} catch (Exception $e) {
    // table may not exist yet
}

$save_msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_settings'])) {
    $keys = ['bing_api_key','amazon_pa_api_key','amazon_pa_secret',
             'amazon_associate_tag','flipkart_affiliate_id','brevo_api_key'];
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS admin_settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");
        $upsert = $pdo->prepare(
            'INSERT INTO admin_settings (setting_key,setting_value) VALUES (:k,:v)
             ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)'
        );
        foreach ($keys as $key) {
            if (isset($_POST[$key])) {
                $upsert->execute([':k'=>$key,':v'=>trim($_POST[$key])]);
                $settings[$key] = trim($_POST[$key]);
            }
        }
        $save_msg = 'Settings saved.';
    } catch (PDOException $e) {
        $save_msg = 'Error: ' . $e->getMessage();
    }
}

function masked($val) {
    if (!$val) return '';
    if (strlen($val) <= 8) return str_repeat('•', strlen($val));
    return substr($val, 0, 4) . str_repeat('•', strlen($val) - 8) . substr($val, -4);
}
?>

<?php if ($save_msg): ?>
<div class="alert <?= str_starts_with($save_msg,'Error')?'alert-error':'alert-success' ?>"><?= htmlspecialchars($save_msg) ?></div>
<?php endif; ?>

<form method="POST" action="">
<div class="card mb-2">
  <div class="card-header"><h2>Image Search</h2></div>
  <div class="card-body">
    <div class="alert alert-info mb-2">
      <div>Get a free Bing Image Search key from
        <a href="https://portal.azure.com" target="_blank">Azure Portal</a>
        → Cognitive Services → Bing Search v7 (1000 calls/month free).
      </div>
    </div>
    <div class="field">
      <label>Bing Image Search API Key</label>
      <input type="text" name="bing_api_key"
             value="<?= htmlspecialchars($settings['bing_api_key'] ?? '') ?>"
             placeholder="32-character key from Azure">
      <?php if (!empty($settings['bing_api_key'])): ?>
        <span class="field-hint">Saved: <?= masked($settings['bing_api_key']) ?></span>
      <?php endif; ?>
    </div>
  </div>
</div>

<div class="card mb-2">
  <div class="card-header"><h2>Amazon Product Advertising API</h2></div>
  <div class="card-body">
    <div class="alert alert-info mb-2">
      <div>
        Needed for real-time prices + product images. Register at
        <a href="https://affiliate-program.amazon.in" target="_blank">Amazon Associates India</a>,
        then enable PA-API in your account.
        You need at least 3 qualifying sales first.
      </div>
    </div>
    <div class="form-row">
      <div class="field">
        <label>Access Key</label>
        <input type="text" name="amazon_pa_api_key"
               value="<?= htmlspecialchars($settings['amazon_pa_api_key'] ?? '') ?>"
               placeholder="AKIAIOSFODNN7EXAMPLE">
      </div>
      <div class="field">
        <label>Secret Key</label>
        <input type="password" name="amazon_pa_secret"
               value="<?= htmlspecialchars($settings['amazon_pa_secret'] ?? '') ?>">
      </div>
    </div>
    <div class="field">
      <label>Associate Tag</label>
      <input type="text" name="amazon_associate_tag"
             value="<?= htmlspecialchars($settings['amazon_associate_tag'] ?? '') ?>"
             placeholder="yoursite-21">
    </div>
  </div>
</div>

<div class="card mb-2">
  <div class="card-header"><h2>Flipkart Affiliate</h2></div>
  <div class="card-body">
    <div class="field">
      <label>Flipkart Affiliate ID</label>
      <input type="text" name="flipkart_affiliate_id"
             value="<?= htmlspecialchars($settings['flipkart_affiliate_id'] ?? '') ?>"
             placeholder="From Flipkart Affiliate Dashboard">
    </div>
  </div>
</div>

<div class="card mb-2">
  <div class="card-header"><h2>Brevo (Email / Price Alerts)</h2></div>
  <div class="card-body">
    <div class="field">
      <label>Brevo API Key</label>
      <input type="text" name="brevo_api_key"
             value="<?= htmlspecialchars($settings['brevo_api_key'] ?? '') ?>"
             placeholder="xkeysib-…">
    </div>
  </div>
</div>

<button type="submit" name="save_settings" class="btn btn-primary">Save Settings</button>
</form>

<div class="card mt-2">
  <div class="card-header"><h2>Cron Jobs (set up in cPanel)</h2></div>
  <div class="card-body">
    <p class="text-sm mb-2">Add these cron jobs in cPanel → Cron Jobs for automated features:</p>
    <table>
      <thead><tr><th>Schedule</th><th>Command</th><th>Purpose</th></tr></thead>
      <tbody>
        <tr>
          <td class="mono text-sm">0 */6 * * *</td>
          <td class="mono text-sm">/usr/bin/php /home/youraccount/public_html/trustedspecs.com/cron/price_tracker.php</td>
          <td class="text-sm">Update prices from Amazon/Flipkart</td>
        </tr>
        <tr>
          <td class="mono text-sm">0 8 * * *</td>
          <td class="mono text-sm">/usr/bin/php /home/youraccount/public_html/trustedspecs.com/cron/send_alerts.php</td>
          <td class="text-sm">Send price drop email alerts</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
