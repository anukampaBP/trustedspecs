#!/usr/bin/env node
// TrustedSpecs GSMArena Scraper — runs on your local Windows PC
// Node.js required (already installed)
//
// USAGE:
//   node scraper.js add "OnePlus 13"              → search + scrape + save JSON
//   node scraper.js add "Samsung S25" "Pixel 9"   → batch scrape multiple phones
//   node scraper.js batch phones.txt               → scrape all names in a text file
//   node scraper.js url "https://gsmarena.com/..."→ scrape a specific URL directly
//   node scraper.js upcoming                       → list upcoming phones
//   node scraper.js upcoming --scrape              → upcoming + auto-scrape all
//   node scraper.js new-launches                   → recently announced phones

import https from 'https';
import http  from 'http';
import fs    from 'fs';
import path  from 'path';

// ── Config ─────────────────────────────────────────────────────────────────────
const OUT_DIR  = './output';        // JSONs saved here
const DELAY_MS = 2000;             // delay between requests — be polite to GSMArena

// ── HTTP fetch (no dependencies) ──────────────────────────────────────────────
function get(url, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) return reject(new Error('Too many redirects'));
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'identity',
                'Referer':         'https://www.gsmarena.com/',
                'Connection':      'keep-alive',
            },
            timeout: 25000,
        }, res => {
            // Follow redirects
            if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
                const next = res.headers.location.startsWith('http')
                    ? res.headers.location
                    : 'https://www.gsmarena.com' + res.headers.location;
                return get(next, redirectCount + 1).then(resolve).catch(reject);
            }
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function clean(html) {
    return html
        .replace(/<br\s*\/?>/gi, ', ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#160;/g, ' ')
        .replace(/&bull;/g, '•')
        .replace(/\s+/g, ' ')
        .replace(/,\s*,/g, ',')
        .replace(/,\s*$/,'')
        .trim();
}

// ── Search GSMArena for a phone name ─────────────────────────────────────────
async function search(query) {
    const url = `https://www.gsmarena.com/search.php3?sQuickSearch=${encodeURIComponent(query)}`;
    const res  = await get(url);
    if (res.status !== 200) throw new Error(`Search returned ${res.status}`);

    const results = [];
    // Primary pattern: makers list
    const ulM = res.body.match(/<div class="makers"[\s\S]*?<ul>([\s\S]*?)<\/ul>/);
    if (ulM) {
        const liPat = /<li[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]*)"[^>]*alt="([^"]*)"[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/g;
        let m;
        while ((m = liPat.exec(ulM[1])) !== null) {
            const name = clean(m[4]) || m[3].trim();
            if (name) results.push({ url: 'https://www.gsmarena.com/' + m[1], image: m[2], name });
        }
    }
    // Fallback: any phone links
    if (!results.length) {
        const fbPat = /<a href="([\w-]+-\d+\.php)"[^>]*>\s*(?:<strong>)?([\w][\w\s]+?)(?:<\/strong>)?\s*<\/a>/g;
        let m;
        while ((m = fbPat.exec(res.body)) !== null) {
            const name = m[2].trim();
            if (name.length > 4 && name.length < 60) {
                results.push({ url: 'https://www.gsmarena.com/' + m[1], image: '', name });
            }
        }
    }
    return results;
}

// ── Scrape a GSMArena phone page ──────────────────────────────────────────────
async function scrape(url) {
    const res = await get(url);
    if (res.status !== 200) throw new Error(`Page returned ${res.status}`);
    const html = res.body;

    const phone = { source_url: url, specs: {} };

    // Name
    const nameM = html.match(/<h1 class="specs-phone-name-title"[^>]*>([^<]+)<\/h1>/);
    phone.name = nameM ? nameM[1].trim() : '';

    // Brand — from breadcrumb
    const breadM = html.match(/<a[^>]+href="[^"]*\/[^"]*\.php\d"[^>]*>([^<]+)<\/a>\s*»\s*<a[^>]+>Phones<\/a>/);
    if (breadM) {
        phone.brand = breadM[1].trim();
    } else {
        // fallback: first word of name
        phone.brand = phone.name.split(' ')[0];
    }

    // Image
    const imgM = html.match(/class="specs-photo-main"[\s\S]{1,200}?<img[^>]+src="([^"]+)"/);
    phone.image = imgM ? imgM[1] : '';

    // Announced / release date
    const annM = html.match(/Announced[\s\S]{1,100}?<td class="nfo"[^>]*>([\s\S]*?)<\/td>/);
    if (annM) phone.announced = clean(annM[1]);

    // Parse spec sections
    // GSMArena structure: <th>Section Name</th> followed by <tr> rows with ttl/nfo cells
    const sectionPattern = /<th[^>]*>([\s\S]*?)<\/th>([\s\S]*?)(?=<th|<\/table>)/g;
    let sm;
    while ((sm = sectionPattern.exec(html)) !== null) {
        const sectionName = clean(sm[1]);
        if (!sectionName || sectionName.length > 80) continue;

        const sectionBlock = sm[2];
        const rowPattern = /<td class="ttl"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?<\/td>\s*<td class="nfo"[^>]*>([\s\S]*?)<\/td>/g;
        let rm;
        const rows = [];
        while ((rm = rowPattern.exec(sectionBlock)) !== null) {
            const key = rm[1].trim();
            const val = clean(rm[2]);
            if (key && val && val !== '-' && val !== 'N/A') {
                rows.push({ key, val });
            }
        }
        if (rows.length) phone.specs[sectionName] = rows;
    }

    // Fallback: get all spec rows if section parsing got nothing
    if (!Object.keys(phone.specs).length) {
        const allRows = [];
        const fallbackPat = /<td class="ttl"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?<\/td>\s*<td class="nfo"[^>]*>([\s\S]*?)<\/td>/g;
        let m;
        while ((m = fallbackPat.exec(html)) !== null) {
            const key = m[1].trim();
            const val = clean(m[2]);
            if (key && val && val !== '-') allRows.push({ key, val });
        }
        if (allRows.length) phone.specs['General'] = allRows;
    }

    return phone;
}

// ── Save phone JSON ───────────────────────────────────────────────────────────
function save(phone) {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    const filename = (phone.name || 'unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
    const filepath = path.join(OUT_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(phone, null, 2));
    return filepath;
}

// ── Search + scrape one phone ─────────────────────────────────────────────────
async function addPhone(query) {
    process.stdout.write(`\n🔍 Searching: "${query}"... `);
    let targetUrl, targetName;

    // Check if query looks like a URL
    if (query.startsWith('http')) {
        targetUrl  = query;
        targetName = path.basename(query).replace(/-\d+\.php$/, '').replace(/-/g, ' ');
    } else {
        const results = await search(query);
        if (!results.length) {
            console.log(`❌ Not found on GSMArena`);
            return null;
        }
        // Pick the best match — prefer exact name match, else take first
        const best = results.find(r => r.name.toLowerCase().includes(query.toLowerCase())) || results[0];
        targetUrl  = best.url;
        targetName = best.name;
        console.log(`Found: ${targetName}`);
    }

    await sleep(DELAY_MS);
    process.stdout.write(`📡 Scraping specs... `);

    try {
        const phone = await scrape(targetUrl);
        if (!phone.name) phone.name = targetName;

        const specCount = Object.values(phone.specs).reduce((a, rows) => a + rows.length, 0);
        const filepath  = save(phone);

        console.log(`✅ Done — ${specCount} specs → ${filepath}`);
        return phone;
    } catch (e) {
        console.log(`❌ Scrape failed: ${e.message}`);
        return null;
    }
}

// ── Parse upcoming page ────────────────────────────────────────────────────────
async function getUpcoming() {
    process.stdout.write('Fetching upcoming phones... ');
    const res = await get('https://www.gsmarena.com/upcoming.php3');
    if (res.status !== 200) throw new Error('Status ' + res.status);

    const phones = [];
    // Multiple list patterns GSMArena uses
    const listPat = /<ul[^>]*>([\s\S]*?)<\/ul>/g;
    let lm;
    while ((lm = listPat.exec(res.body)) !== null) {
        const liPat = /<li[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]*)"[^>]*alt="([^"]*)"[\s\S]*?<\/a>/g;
        let m;
        while ((m = liPat.exec(lm[1])) !== null) {
            const name = m[3].trim();
            if (name && !phones.find(p => p.name === name)) {
                phones.push({ url: 'https://www.gsmarena.com/' + m[1], image: m[2], name });
            }
        }
    }

    // Fallback
    if (!phones.length) {
        const altPat = /<div class="module-item-title">\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        let m;
        while ((m = altPat.exec(res.body)) !== null) {
            const name = clean(m[2]);
            if (name) phones.push({ url: 'https://www.gsmarena.com' + m[1], name });
        }
    }
    console.log(`Found ${phones.length} phones`);
    return phones;
}

// ── Get new launches (last 30 days) ───────────────────────────────────────────
async function getNewLaunches() {
    process.stdout.write('Fetching recent launches... ');
    // GSMArena "new phones" page
    const res = await get('https://www.gsmarena.com/search.php3?chk1900=selected&chk1901=selected&chk1902=selected&chk1903=selected&chkAvailabilities1=selected&sAvailabilities=1&fDisplayInchesMin=0&fDisplayInchesMax=0&chk1920=selected&fOrderBy=1');
    if (res.status !== 200) throw new Error('Status ' + res.status);

    const phones = [];
    const pat = /<div class="makers"[\s\S]*?<ul>([\s\S]*?)<\/ul>/;
    const listM = res.body.match(pat);
    if (listM) {
        const liPat = /<a href="([^"]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]*)"[^>]*alt="([^"]*)"[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/g;
        let m;
        while ((m = liPat.exec(listM[1])) !== null) {
            const name = clean(m[4]) || m[3].trim();
            if (name) phones.push({ url: 'https://www.gsmarena.com/' + m[1], image: m[2], name });
        }
    }
    console.log(`Found ${phones.length} recent phones`);
    return phones;
}

// ── Print summary ──────────────────────────────────────────────────────────────
function printSummary(phones) {
    phones.forEach((p, i) => {
        console.log(`  ${String(i+1).padStart(3)}. ${p.name}`);
        if (p.url) console.log(`       ${p.url}`);
    });
}

// ── CLI ────────────────────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const cmd  = args[0];

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  TrustedSpecs Phone Scraper');
    console.log('  Output folder: ' + path.resolve(OUT_DIR));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!cmd || cmd === 'help') {
        console.log(`Commands:
  node scraper.js add "Phone Name"         Search + scrape one phone
  node scraper.js add "A" "B" "C"          Batch scrape multiple phones
  node scraper.js batch phones.txt         Scrape all names from a text file (one per line)
  node scraper.js url "https://..."        Scrape a specific GSMArena URL
  node scraper.js upcoming                 List upcoming phones
  node scraper.js upcoming --scrape        List + scrape all upcoming phones
  node scraper.js new-launches             List recently released phones
  node scraper.js new-launches --scrape    List + scrape all recent launches

After scraping, go to:
  admin.trustedspecs.com → Phone Fetcher → paste/upload the JSON files
`);
        return;
    }

    // ── add (one or many phone names) ─────────────────────────────────────────
    if (cmd === 'add') {
        const phones = args.slice(1);
        if (!phones.length) { console.log('Provide at least one phone name'); return; }
        console.log(`Adding ${phones.length} phone(s)...\n`);
        let ok = 0, fail = 0;
        for (const name of phones) {
            const result = await addPhone(name);
            result ? ok++ : fail++;
            if (phones.indexOf(name) < phones.length - 1) await sleep(DELAY_MS);
        }
        console.log(`\n✅ Done: ${ok} scraped, ${fail} failed`);
        console.log(`📁 Files saved to: ${path.resolve(OUT_DIR)}`);
        console.log(`📤 Now import them at: admin.trustedspecs.com → Phone Fetcher`);
        return;
    }

    // ── url (direct URL) ──────────────────────────────────────────────────────
    if (cmd === 'url') {
        const url = args[1];
        if (!url) { console.log('Provide a GSMArena URL'); return; }
        await addPhone(url);
        console.log(`📁 Saved to: ${path.resolve(OUT_DIR)}`);
        return;
    }

    // ── batch (from text file) ────────────────────────────────────────────────
    if (cmd === 'batch') {
        const file = args[1];
        if (!file || !fs.existsSync(file)) {
            console.log(`File not found: ${file}`);
            console.log('Create a text file with one phone name per line, e.g. phones.txt');
            return;
        }
        const names = fs.readFileSync(file, 'utf8')
            .split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#'));

        console.log(`Found ${names.length} phones in ${file}:\n`);
        names.forEach((n, i) => console.log(`  ${i+1}. ${n}`));
        console.log('\nStarting scrape...');

        let ok = 0, fail = 0;
        for (let i = 0; i < names.length; i++) {
            console.log(`\n[${i+1}/${names.length}]`);
            const result = await addPhone(names[i]);
            result ? ok++ : fail++;
            if (i < names.length - 1) await sleep(DELAY_MS);
        }
        console.log(`\n━━━ Summary ━━━`);
        console.log(`✅ Scraped: ${ok}`);
        console.log(`❌ Failed:  ${fail}`);
        console.log(`📁 Files:   ${path.resolve(OUT_DIR)}`);
        console.log(`📤 Import:  admin.trustedspecs.com → Phone Fetcher`);
        return;
    }

    // ── upcoming ──────────────────────────────────────────────────────────────
    if (cmd === 'upcoming') {
        const doScrape = args.includes('--scrape');
        const phones = await getUpcoming();
        if (!phones.length) { console.log('No phones found. GSMArena may have changed layout.'); return; }

        console.log('\nUpcoming phones:\n');
        printSummary(phones);

        if (doScrape) {
            console.log(`\nScraping all ${phones.length} phones...\n`);
            let ok = 0, fail = 0;
            for (let i = 0; i < phones.length; i++) {
                console.log(`[${i+1}/${phones.length}]`);
                try {
                    const phone = await scrape(phones[i].url);
                    if (!phone.name) phone.name = phones[i].name;
                    if (!phone.image && phones[i].image) phone.image = phones[i].image;
                    const specCount = Object.values(phone.specs).reduce((a,r)=>a+r.length,0);
                    const fp = save(phone);
                    console.log(`  ✅ ${phone.name} — ${specCount} specs → ${fp}`);
                    ok++;
                } catch(e) {
                    console.log(`  ❌ ${phones[i].name}: ${e.message}`);
                    fail++;
                }
                if (i < phones.length - 1) await sleep(DELAY_MS);
            }
            console.log(`\n✅ Done: ${ok} scraped, ${fail} failed`);
            console.log(`📁 Files: ${path.resolve(OUT_DIR)}`);
        } else {
            console.log('\nTo scrape all: node scraper.js upcoming --scrape');
            console.log('To scrape one: node scraper.js url "<url above>"');
        }
        return;
    }

    // ── new-launches ──────────────────────────────────────────────────────────
    if (cmd === 'new-launches') {
        const doScrape = args.includes('--scrape');
        const phones = await getNewLaunches();
        if (!phones.length) { console.log('No phones found.'); return; }

        console.log('\nRecently launched phones:\n');
        printSummary(phones);

        if (doScrape) {
            console.log(`\nScraping all ${phones.length} phones...\n`);
            let ok = 0, fail = 0;
            for (let i = 0; i < phones.length; i++) {
                console.log(`[${i+1}/${phones.length}]`);
                try {
                    const phone = await scrape(phones[i].url);
                    if (!phone.name) phone.name = phones[i].name;
                    if (!phone.image && phones[i].image) phone.image = phones[i].image;
                    const specCount = Object.values(phone.specs).reduce((a,r)=>a+r.length,0);
                    const fp = save(phone);
                    console.log(`  ✅ ${phone.name} — ${specCount} specs → ${fp}`);
                    ok++;
                } catch(e) {
                    console.log(`  ❌ ${phones[i].name}: ${e.message}`);
                    fail++;
                }
                if (i < phones.length - 1) await sleep(DELAY_MS);
            }
            console.log(`\n✅ Done: ${ok} scraped, ${fail} failed`);
            console.log(`📁 Files: ${path.resolve(OUT_DIR)}`);
        } else {
            console.log('\nTo scrape all: node scraper.js new-launches --scrape');
        }
        return;
    }

    console.log(`Unknown command: ${cmd}. Run: node scraper.js help`);
}

main().catch(e => { console.error('\n❌ Fatal error:', e.message); process.exit(1); });
