const express      = require('express');
const multer       = require('multer');
const sharp        = require('sharp');
const heicConvert  = require('heic-convert');
const fs           = require('fs');
const path         = require('path');
const { exec } = require('child_process');

const app        = express();
const PORT       = 3000;
const GALLERY    = path.resolve(__dirname, '..');
const CONTENT_MD = path.join(GALLERY, 'CONTENT.md');
const UPLOAD_TMP = path.join(__dirname, 'uploads_tmp');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/preview', express.static(GALLERY));

// ─── CONTENT.md parser ────────────────────────────────────────────────────────

function parseContent(raw) {
  const lines = raw.split('\n');
  const pages = [];
  let i = 0;

  while (i < lines.length) {
    // Match: ## Artwork Page (`artwork/`)
    const m = lines[i].match(/^## (.+?) Page \(`([^`/]+)\/?`\)/);
    if (m) {
      const name = m[1].trim();
      const dir  = m[2].replace(/\/$/, '');

      // Advance to table header
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith('| Order')) j++;
      if (j >= lines.length) { i++; continue; }

      const headerCols = lines[j].split('|').map(c => c.trim()).filter(Boolean);
      const isSingle   = headerCols.includes('Description');
      j += 2; // skip separator

      const photos = [];
      while (j < lines.length && lines[j].startsWith('|')) {
        const cols = lines[j].split('|').map(c => c.trim()).filter(Boolean);
        if (cols.length >= 3 && /^\d+$/.test(cols[0])) {
          if (isSingle) {
            photos.push({ filename: cols[1], title: cols[2], desc: cols[3] || '' });
          } else {
            photos.push({ filename: cols[1], caption: cols[2] });
          }
        }
        j++;
      }

      pages.push({ id: dir, name, dir, type: isSingle ? 'single' : 'masonry', photos });
      i = j;
      continue;
    }
    i++;
  }

  return { pages };
}

// ─── CONTENT.md serializer ────────────────────────────────────────────────────

function serializeContent(data) {
  let out = `# Site Content\n\n`;
  out += `> This file is the source of truth for all page names and photo labels.\n`;
  out += `> Edit the tables below, then ask Claude to rebuild the site from this file.\n\n---\n\n`;
  out += `## Pages\n\n| Page | Name | URL |\n|------|------|-----|\n`;
  out += `| Home | Art Gallery | https://shalaball.com/ |\n`;

  for (const p of data.pages) {
    out += `| ${p.name} | ${p.name} | https://shalaball.com/${p.dir}/ |\n`;
  }

  for (const p of data.pages) {
    out += `\n---\n\n## ${p.name} Page (\`${p.dir}/\`)\n\n`;
    if (p.type === 'masonry') {
      out += `> Layout: Two-column masonry grid. Photos load in the order listed. Caption appears below each photo.\n\n`;
      out += `| Order | Filename | Caption |\n|-------|----------|---------|\n`;
      p.photos.forEach((ph, i) => {
        out += `| ${i + 1} | ${ph.filename} | ${ph.caption || ''} |\n`;
      });
    } else {
      out += `> Layout: Single-column centered, max 720px. Photos display in the order listed. Title and optional description appear below each photo.\n\n`;
      out += `| Order | Filename | Title | Description |\n|-------|----------|-------|-------------|\n`;
      p.photos.forEach((ph, i) => {
        out += `| ${i + 1} | ${ph.filename} | ${ph.title || ''} | ${ph.desc || ''} |\n`;
      });
    }
  }

  return out;
}

// ─── labels.js rebuilder ──────────────────────────────────────────────────────

function rebuildLabels(data) {
  for (const p of data.pages) {
    const dest = path.join(GALLERY, p.dir, 'labels.js');
    if (!fs.existsSync(path.dirname(dest))) continue;

    let entries, content;
    if (p.type === 'masonry') {
      entries = p.photos.map(ph => {
        const zoom = ph.zoom && ph.zoom !== 1 ? `, zoom: ${ph.zoom}` : '';
        return `  { filename: ${JSON.stringify(ph.filename)}, caption: ${JSON.stringify(ph.caption || '')}${zoom} },`;
      }).join('\n');
      content = `// Auto-generated from CONTENT.md — do not edit directly.\n// To update labels or order, use the admin UI or edit CONTENT.md.\n\nconst LABELS = [\n${entries}\n];\n`;
    } else {
      entries = p.photos.map(ph => {
        const zoom = ph.zoom && ph.zoom !== 1 ? `, zoom: ${ph.zoom}` : '';
        return `  { filename: ${JSON.stringify(ph.filename)}, title: ${JSON.stringify(ph.title || '')}, desc: ${JSON.stringify(ph.desc || '')}${zoom} },`;
      }).join('\n');
      content = `// Auto-generated from CONTENT.md — do not edit directly.\n// To update labels or order, use the admin UI or edit CONTENT.md.\n\nconst LABELS = [\n${entries}\n];\n`;
    }

    fs.writeFileSync(dest, content);
  }
}

// ─── Page title rebuilder ─────────────────────────────────────────────────────

function rebuildPageTitles(data) {
  for (const p of data.pages) {
    const pageFile = path.join(GALLERY, p.dir, 'index.html');
    if (!fs.existsSync(pageFile)) continue;
    let html = fs.readFileSync(pageFile, 'utf8');
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${p.name}</title>`);
    html = html.replace(/(<h1>)[^<]*(<\/h1>)/, `$1${p.name}$2`);
    fs.writeFileSync(pageFile, html);
  }
}

// ─── Nav updater (for new pages) ─────────────────────────────────────────────

function updateNav(data) {
  // Build nav link list for each context
  const homeNavLinks     = data.pages.map(p => `  <a href="${p.dir}/">${p.name}</a>`).join('\n');
  const homeGalleryLinks = data.pages.map(p => `  <a class="gallery-link" href="${p.dir}/">${p.name}</a>`).join('\n');

  // Update home index.html
  const homeFile = path.join(GALLERY, 'index.html');
  let homeHtml = fs.readFileSync(homeFile, 'utf8');
  homeHtml = homeHtml.replace(/(<nav>)([\s\S]*?)(<\/nav>)/, `$1\n${homeNavLinks}\n$3`);
  homeHtml = homeHtml.replace(/(<div class="gallery-list">)([\s\S]*?)(<\/div>)/, `$1\n${homeGalleryLinks}\n$3`);
  fs.writeFileSync(homeFile, homeHtml);

  // Update each gallery page's nav
  for (const p of data.pages) {
    const pageFile = path.join(GALLERY, p.dir, 'index.html');
    if (!fs.existsSync(pageFile)) continue;
    let html = fs.readFileSync(pageFile, 'utf8');

    const galleryNavLinks = [
      `  <a href="../">Home</a>`,
      ...data.pages.map(q =>
        `  <a href="../${q.dir}/"${q.id === p.id ? ' class="active"' : ''}>${q.name}</a>`
      )
    ].join('\n');

    html = html.replace(/(<nav>)([\s\S]*?)(<\/nav>)/, `$1\n${galleryNavLinks}\n$3`);
    fs.writeFileSync(pageFile, html);
  }
}

// ─── New page HTML generator ──────────────────────────────────────────────────

function buildPageHtml(newPage, allPages) {
  const template = newPage.type === 'masonry' ? 'page-1' : 'page-2';
  let html = fs.readFileSync(path.join(GALLERY, template, 'index.html'), 'utf8');

  // Update title and h1
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${newPage.name}</title>`);
  html = html.replace(/(<h1>)[^<]*(<\/h1>)/, `$1${newPage.name}$2`);

  // Clear the gallery div (it's already empty after our earlier edit, but just in case)
  html = html.replace(/<div class="gallery" id="gallery">[\s\S]*?<\/div>/, '<div class="gallery" id="gallery"></div>');

  // Nav will be set by updateNav() after the page is added
  return html;
}

// ─── All HTML files helper ────────────────────────────────────────────────────

function getAllHtmlFiles() {
  const files = [path.join(GALLERY, 'index.html')];
  const raw   = fs.readFileSync(CONTENT_MD, 'utf8');
  const data  = parseContent(raw);
  for (const p of data.pages) {
    const f = path.join(GALLERY, p.dir, 'index.html');
    if (fs.existsSync(f)) files.push(f);
  }
  return files;
}

// ─── Font config ──────────────────────────────────────────────────────────────

const TITLE_FONT_PARAMS = {
  'Cormorant Garamond': 'family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300',
  'Playfair Display':   'family=Playfair+Display:ital,wght@0,400;0,700;1,400',
  'EB Garamond':        'family=EB+Garamond:ital,wght@0,400;1,400',
  'Lora':               'family=Lora:ital,wght@0,400;0,700;1,400',
};

const BODY_FONT_PARAMS = {
  'Montserrat': 'family=Montserrat:wght@300;400',
  'Lato':       'family=Lato:wght@300;400',
  'Open Sans':  'family=Open+Sans:wght@300;400',
  'Raleway':    'family=Raleway:wght@300;400',
};

// ─── HEIC helper ──────────────────────────────────────────────────────────────

// Returns a Buffer (if HEIC) or the original file path (if not) for sharp to consume.
async function toSharpInput(filePath) {
  const buf = await fs.promises.readFile(filePath);
  // HEIC/HEIF files have 'ftyp' at byte offset 4
  if (buf.length >= 8 && buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    return Buffer.from(await heicConvert({ buffer: buf, format: 'JPEG', quality: 1 }));
  }
  return filePath;
}

// ─── API routes ───────────────────────────────────────────────────────────────

// Get all content
app.get('/api/content', (req, res) => {
  try {
    const raw  = fs.readFileSync(CONTENT_MD, 'utf8');
    const data = parseContent(raw);

    // Merge zoom values from labels.js (zoom is stored there, not in CONTENT.md)
    for (const p of data.pages) {
      const labelsPath = path.join(GALLERY, p.dir, 'labels.js');
      if (!fs.existsSync(labelsPath)) continue;
      const src = fs.readFileSync(labelsPath, 'utf8');
      const zoomMap = {};
      for (const m of src.matchAll(/filename:\s*"([^"]+)"[^}]*zoom:\s*([0-9.]+)/g)) {
        zoomMap[m[1]] = parseFloat(m[2]);
      }
      for (const ph of p.photos) ph.zoom = zoomMap[ph.filename] || 1;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save content (labels + order + page names)
app.post('/api/content', (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(CONTENT_MD, serializeContent(data));
    rebuildLabels(data);
    rebuildPageTitles(data);
    updateNav(data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload photos to a page (compresses to max 2000px / 85% JPEG quality)
const upload = multer({ dest: UPLOAD_TMP });
app.post('/api/upload/:page', upload.array('photos'), async (req, res) => {
  try {
    const { page } = req.params;
    const photosDir = path.join(GALLERY, page, 'photos');

    if (!fs.existsSync(photosDir)) {
      return res.status(400).json({ error: `Page "${page}" not found` });
    }

    const raw      = fs.readFileSync(CONTENT_MD, 'utf8');
    const data     = parseContent(raw);
    const pageData = data.pages.find(p => p.id === page);

    if (!pageData) return res.status(400).json({ error: 'Page not found in CONTENT.md' });

    const added = [];
    for (const file of req.files) {
      const filename = file.originalname;
      const dest     = path.join(photosDir, filename);

      // Auto-rotate from EXIF, resize to max 2000px, 85% JPEG quality
      // toSharpInput converts HEIC/HEIF to a JPEG buffer first if needed
      const input = await toSharpInput(file.path);
      await sharp(input)
        .rotate()
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(dest);
      fs.unlinkSync(file.path);

      if (!pageData.photos.find(p => p.filename === filename)) {
        if (pageData.type === 'masonry') {
          pageData.photos.push({ filename, caption: 'Untitled' });
        } else {
          pageData.photos.push({ filename, title: 'Untitled', desc: '' });
        }
        added.push(filename);
      }
    }

    fs.writeFileSync(CONTENT_MD, serializeContent(data));
    rebuildLabels(data);
    res.json({ ok: true, added });
  } catch (err) {
    for (const file of req.files || []) {
      try { fs.unlinkSync(file.path); } catch (_) {}
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete a photo
app.delete('/api/photo/:page/:filename', (req, res) => {
  try {
    const { page, filename } = req.params;
    const photoPath = path.join(GALLERY, page, 'photos', filename);

    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);

    const raw  = fs.readFileSync(CONTENT_MD, 'utf8');
    const data = parseContent(raw);
    const pageData = data.pages.find(p => p.id === page);
    if (pageData) pageData.photos = pageData.photos.filter(p => p.filename !== filename);

    fs.writeFileSync(CONTENT_MD, serializeContent(data));
    rebuildLabels(data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new page
app.post('/api/page', (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });

    const dir    = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newDir = path.join(GALLERY, dir);

    if (fs.existsSync(newDir)) return res.status(400).json({ error: 'A page with that name already exists' });

    // Create directory structure
    fs.mkdirSync(newDir);
    fs.mkdirSync(path.join(newDir, 'photos'));
    fs.writeFileSync(path.join(newDir, 'labels.js'), '// Auto-generated from CONTENT.md\n\nconst LABELS = [];\n');

    // Add to CONTENT.md
    const raw  = fs.readFileSync(CONTENT_MD, 'utf8');
    const data = parseContent(raw);
    const newPage = { id: dir, name, dir, type, photos: [] };
    data.pages.push(newPage);

    // Write index.html (before updateNav so template is in place)
    fs.writeFileSync(path.join(newDir, 'index.html'), buildPageHtml(newPage, data.pages));

    // Save content and update nav on all pages
    fs.writeFileSync(CONTENT_MD, serializeContent(data));
    updateNav(data);

    res.json({ ok: true, dir });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a page
app.delete('/api/page/:id', (req, res) => {
  try {
    const { id } = req.params;
    const raw  = fs.readFileSync(CONTENT_MD, 'utf8');
    const data = parseContent(raw);

    const idx = data.pages.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Page not found' });

    data.pages.splice(idx, 1);
    fs.writeFileSync(CONTENT_MD, serializeContent(data));
    updateNav(data);

    const pageDir = path.join(GALLERY, id);
    if (fs.existsSync(pageDir)) fs.rmSync(pageDir, { recursive: true, force: true });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reorder pages
app.post('/api/reorder', (req, res) => {
  try {
    const { pageIds } = req.body;
    const raw  = fs.readFileSync(CONTENT_MD, 'utf8');
    const data = parseContent(raw);

    const reordered = pageIds.map(id => data.pages.find(p => p.id === id)).filter(Boolean);
    const rest      = data.pages.filter(p => !pageIds.includes(p.id));
    data.pages = [...reordered, ...rest];

    fs.writeFileSync(CONTENT_MD, serializeContent(data));
    updateNav(data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get home page text
app.get('/api/home', (req, res) => {
  try {
    const html     = fs.readFileSync(path.join(GALLERY, 'index.html'), 'utf8');
    const title    = (html.match(/<h1>([^<]*)<\/h1>/)    || [])[1] || '';
    const subtitle = (html.match(/<header>[^]*?<p>([^<]*)<\/p>/) || [])[1] || '';
    const footer   = (html.match(/<footer>([^<]*)<\/footer>/)  || [])[1] || '';
    res.json({ title, subtitle, footer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save home page text
app.post('/api/home', (req, res) => {
  try {
    const { title, subtitle, footer } = req.body;
    const homeFile = path.join(GALLERY, 'index.html');
    let html = fs.readFileSync(homeFile, 'utf8');
    if (title    !== undefined) html = html.replace(/(<h1>)[^<]*(<\/h1>)/,    `$1${title}$2`);
    if (subtitle !== undefined) html = html.replace(/(<header>[^]*?<p>)[^<]*(<\/p>)/, `$1${subtitle}$2`);
    if (footer   !== undefined) html = html.replace(/(<footer>)[^<]*(<\/footer>)/, `$1${footer}$2`);
    fs.writeFileSync(homeFile, html);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get site design settings
app.get('/api/settings', (req, res) => {
  try {
    const html       = fs.readFileSync(path.join(GALLERY, 'index.html'), 'utf8');
    const bgMatch    = html.match(/body\s*\{[^}]*background:\s*(#[a-fA-F0-9]{3,6})/);
    const colorMatch = html.match(/body\s*\{[^}]*\bcolor:\s*(#[a-fA-F0-9]{3,6})/);
    const bodyFontM  = html.match(/body\s*\{[^}]*font-family:\s*'([^']+)'/);
    const titleFontM = html.match(/header h1\s*\{[^}]*font-family:\s*'([^']+)'/);
    const titleSizeM = html.match(/header h1\s*\{[^}]*font-size:\s*([0-9.]+)rem/);
    const bodySizeM  = html.match(/body\s*\{[^}]*font-size:\s*([0-9.]+)px/);
    res.json({
      bgColor:   bgMatch    ? bgMatch[1]              : '#ffffff',
      textColor: colorMatch ? colorMatch[1]           : '#222222',
      bodyFont:  bodyFontM  ? bodyFontM[1]            : 'Montserrat',
      titleFont: titleFontM ? titleFontM[1]           : 'Cormorant Garamond',
      titleSize: titleSizeM ? parseFloat(titleSizeM[1]) : 3,
      bodySize:  bodySizeM  ? parseInt(bodySizeM[1])    : 14,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save site design settings
app.post('/api/settings', (req, res) => {
  try {
    const { bgColor, textColor, titleFont, bodyFont, titleSize, bodySize } = req.body;
    const titleParam = TITLE_FONT_PARAMS[titleFont];
    const bodyParam  = BODY_FONT_PARAMS[bodyFont];
    if (!titleParam || !bodyParam) return res.status(400).json({ error: 'Unknown font' });

    const fontsUrl = `https://fonts.googleapis.com/css2?${titleParam}&${bodyParam}&display=swap`;
    for (const filePath of getAllHtmlFiles()) {
      let html = fs.readFileSync(filePath, 'utf8');
      // Update Google Fonts link
      html = html.replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/, fontsUrl);
      // Update body background color
      html = html.replace(/(body\s*\{[^}]*)background:\s*#[a-fA-F0-9]{3,6}/, `$1background: ${bgColor}`);
      // Update body text color
      html = html.replace(/(body\s*\{[^}]*)\bcolor:\s*#[a-fA-F0-9]{3,6}/, `$1color: ${textColor}`);
      // Update all sans-serif families (body font)
      html = html.replace(/font-family:\s*'[^']+',\s*sans-serif/g, `font-family: '${bodyFont}', sans-serif`);
      // Update all serif families (title font)
      html = html.replace(/font-family:\s*'[^']+',\s*serif/g, `font-family: '${titleFont}', serif`);
      // Update title (h1) font size
      if (titleSize !== undefined) {
        html = html.replace(/(header h1\s*\{[^}]*)font-size:\s*[0-9.]+rem/, `$1font-size: ${titleSize}rem`);
      }
      // Update body font size (inject after color: if not yet present)
      if (bodySize !== undefined) {
        if (html.match(/body\s*\{[^}]*font-size:/)) {
          html = html.replace(/(body\s*\{[^}]*)font-size:\s*[0-9.]+px/, `$1font-size: ${bodySize}px`);
        } else {
          html = html.replace(/(body\s*\{[^}]*\bcolor:\s*#[a-fA-F0-9]{3,6};)/, `$1\n      font-size: ${bodySize}px;`);
        }
      }
      fs.writeFileSync(filePath, html);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rotate a photo in-place
app.post('/api/rotate/:page/:filename', async (req, res) => {
  try {
    const { page, filename } = req.params;
    const { direction } = req.body; // 'cw' or 'ccw'
    const photoPath = path.join(GALLERY, page, 'photos', filename);

    if (!fs.existsSync(photoPath)) return res.status(404).json({ error: 'Photo not found' });

    const degrees = direction === 'ccw' ? -90 : 90;
    const tmp = photoPath + '.tmp.jpg';
    await sharp(photoPath).rotate(degrees).jpeg({ quality: 85 }).toFile(tmp);
    fs.renameSync(tmp, photoPath);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quit server
app.post('/api/quit', (_req, res) => {
  res.json({ ok: true });
  setTimeout(() => process.exit(0), 100);
});

// Push to GitHub
app.post('/api/push', (req, res) => {
  const { message = 'Update gallery content' } = req.body;
  const cmd = `git -C "${GALLERY}" add -A && git -C "${GALLERY}" commit -m "${message.replace(/"/g, '\\"')}" && git -C "${GALLERY}" push`;
  exec(cmd, (err, stdout, stderr) => {
    res.json({
      ok: !err || stderr.includes('Everything up-to-date'),
      output: (stdout + stderr).trim(),
      error: err ? err.message : null
    });
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

if (!fs.existsSync(UPLOAD_TMP)) fs.mkdirSync(UPLOAD_TMP, { recursive: true });

app.listen(PORT, () => {
  console.log('\nShala Gallery Admin');
  console.log(`→ Admin:   http://localhost:${PORT}`);
  console.log(`→ Preview: http://localhost:${PORT}/preview/\n`);
});
