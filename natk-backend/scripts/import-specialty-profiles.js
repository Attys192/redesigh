const https = require('https');
const { createHash } = require('crypto');
const axiosModule = require('../node_modules/axios');
const axios = axiosModule.default || axiosModule;
const cheerio = require('../node_modules/cheerio');
const { Client } = require('../node_modules/pg');

const DB_CONFIG = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '2306',
  database: process.env.DATABASE_NAME || 'natk_db',
};

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const FORCE = process.argv.includes('--force');
const REFRESH_DAYS = 7;

function normalizeText(text) {
  return String(text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function toAbsoluteUrl(url) {
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `https://natk.ru${url}`;
  return `https://natk.ru/${url}`;
}

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS specialty_profiles (
      id SERIAL PRIMARY KEY,
      specialty_id INTEGER NOT NULL REFERENCES specialties_v2(id) ON DELETE CASCADE,
      source_url TEXT NOT NULL,
      description TEXT,
      full_text TEXT NOT NULL DEFAULT '',
      content_html TEXT,
      disciplines TEXT[] NOT NULL DEFAULT '{}',
      professional_areas TEXT[] NOT NULL DEFAULT '{}',
      skills TEXT[] NOT NULL DEFAULT '{}',
      career_options TEXT[] NOT NULL DEFAULT '{}',
      content_hash TEXT NOT NULL,
      source_updated_at TIMESTAMP NULL,
      last_parsed_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (specialty_id)
    )
  `);
}

function isStale(date) {
  if (FORCE) return true;
  if (!date) return true;
  return Date.now() - new Date(date).getTime() > REFRESH_DAYS * 24 * 60 * 60 * 1000;
}

function extractLinks($) {
  const byCode = new Map();

  $('a[href]').each((_, element) => {
    const text = normalizeText($(element).text());
    const href = $(element).attr('href') || '';
    const match = text.match(/\d{2}\.\d{2}\.\d{2}/) || href.match(/\d{2}[.-]\d{2}[.-]\d{2}/);
    if (!match) return;

    const code = match[0].replace(/-/g, '.');
    const url = toAbsoluteUrl(href);
    const existing = byCode.get(code);
    if (!existing || url.includes('/sveden/education/')) byCode.set(code, { code, url });
  });

  return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code));
}

function extractListAfterText($, content, markers) {
  const marker = content
    .find('p, div, h2, h3, h4')
    .toArray()
    .find((element) => {
      const text = normalizeText($(element).text()).toLowerCase();
      return markers.some((item) => text.includes(item.toLowerCase()));
    });

  if (!marker) return [];

  const list = $(marker).nextAll('ul, ol').first();
  if (!list.length) return [];

  return list
    .find('li')
    .toArray()
    .map((li) => normalizeText($(li).text()).replace(/[.;]+$/, ''))
    .filter(Boolean);
}

function extractProfile($, initialUrl, finalUrl) {
  const body = $('[itemprop=articleBody]').first();
  const content = body.length ? body : $('.item-page').first();
  const contentHtml = content.html()?.trim() || '';
  const fullText = normalizeText(content.text());
  const paragraphs = content
    .find('p')
    .toArray()
    .map((p) => normalizeText($(p).text()))
    .filter((text) => text.length > 40);
  const description = paragraphs.find((text) => !text.includes('Область профессиональной деятельности')) || null;
  const updatedText = normalizeText($('.item-page, #content').first().text());
  const updatedMatch = updatedText.match(/Обновлено:\s*(\d{2})\.(\d{2})\.(\d{4})/i);
  const sourceUpdatedAt = updatedMatch
    ? new Date(Number(updatedMatch[3]), Number(updatedMatch[2]) - 1, Number(updatedMatch[1]))
    : null;

  return {
    sourceUrl: finalUrl || initialUrl,
    description,
    fullText,
    contentHtml,
    disciplines: extractListAfterText($, content, ['Студенты изучают', 'специальные дисциплины']),
    professionalAreas: extractListAfterText($, content, ['Область профессиональной деятельности', 'включает в себя']),
    skills: extractListAfterText($, content, ['Выпускник', 'должен']),
    careerOptions: extractListAfterText($, content, ['может работать', 'должности', 'профессии']),
    contentHash: createHash('sha256').update(fullText).digest('hex'),
    sourceUpdatedAt,
  };
}

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  await ensureTable(client);

  const listResponse = await axios.get('https://natk.ru/abitur/list', { httpsAgent });
  const links = extractLinks(cheerio.load(listResponse.data));
  let checked = 0;
  let updated = 0;
  let skipped = 0;

  for (const link of links) {
    const specialty = await client.query('SELECT id FROM specialties_v2 WHERE code = $1 LIMIT 1', [link.code]);
    const specialtyId = specialty.rows[0]?.id;
    if (!specialtyId) {
      console.warn(`Skip ${link.code}: code is absent in specialties_v2`);
      continue;
    }

    const existing = await client.query(
      'SELECT id, content_hash, last_checked_at FROM specialty_profiles WHERE specialty_id = $1 LIMIT 1',
      [specialtyId],
    );
    const row = existing.rows[0];
    if (row && !isStale(row.last_checked_at)) {
      skipped++;
      continue;
    }

    checked++;
    const page = await axios.get(link.url, { httpsAgent });
    const $ = cheerio.load(page.data);
    const profile = extractProfile($, link.url, page.request?.res?.responseUrl);

    if (profile.fullText.length < 100) {
      console.warn(`Skip ${link.code}: profile text is too short`);
      continue;
    }

    if (row?.content_hash === profile.contentHash) {
      await client.query('UPDATE specialty_profiles SET last_checked_at = NOW() WHERE id = $1', [row.id]);
    } else {
      await client.query(
        `INSERT INTO specialty_profiles
          (specialty_id, source_url, description, full_text, content_html, disciplines, professional_areas,
           skills, career_options, content_hash, source_updated_at, last_parsed_at, last_checked_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         ON CONFLICT (specialty_id)
         DO UPDATE SET
           source_url = EXCLUDED.source_url,
           description = EXCLUDED.description,
           full_text = EXCLUDED.full_text,
           content_html = EXCLUDED.content_html,
           disciplines = EXCLUDED.disciplines,
           professional_areas = EXCLUDED.professional_areas,
           skills = EXCLUDED.skills,
           career_options = EXCLUDED.career_options,
           content_hash = EXCLUDED.content_hash,
           source_updated_at = EXCLUDED.source_updated_at,
           last_parsed_at = NOW(),
           last_checked_at = NOW()`,
        [
          specialtyId,
          profile.sourceUrl,
          profile.description,
          profile.fullText,
          profile.contentHtml,
          profile.disciplines,
          profile.professionalAreas,
          profile.skills,
          profile.careerOptions,
          profile.contentHash,
          profile.sourceUpdatedAt,
        ],
      );
      updated++;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  await client.end();
  console.log(`Links: ${links.length}`);
  console.log(`Checked: ${checked}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped fresh: ${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
