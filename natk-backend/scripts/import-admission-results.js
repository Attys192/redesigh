const https = require('https');
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

function normalizeText(text) {
  return String(text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseNullableInteger(value) {
  if (!value) return null;
  const normalized = String(value).replace(/\s+/g, '').replace(/[^\d-]/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableNumber(value) {
  if (!value) return null;
  const normalized = String(value).trim().replace(',', '.');
  if (!normalized || /^[xх-]$/i.test(normalized)) return null;
  const match = normalized.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function updateContext(text, context) {
  if (text.includes('Очная форма обучения')) {
    context.formType = 'full-time';
    context.educationBase = undefined;
    context.fundingType = undefined;
    return;
  }

  if (text.includes('Заочная форма обучения')) {
    context.formType = 'part-time';
    context.educationBase = undefined;
    context.fundingType = undefined;
    return;
  }

  if (text.includes('Основное общее образование')) {
    context.educationBase = 9;
    context.fundingType = undefined;
    return;
  }

  if (text.includes('Среднее общее образование')) {
    context.educationBase = 11;
    context.fundingType = undefined;
    return;
  }

  if (text.includes('За счет бюджетных ассигнований')) {
    context.fundingType = 'budget';
    return;
  }

  if (text.includes('По договорам об оказании платных образовательных услуг')) {
    context.fundingType = 'paid';
  }
}

async function ensureCampaign(client, year) {
  const existing = await client.query('SELECT id FROM admission_campaigns WHERE year = $1 LIMIT 1', [year]);
  if (existing.rows[0]?.id) return Number(existing.rows[0].id);

  const inserted = await client.query(
    'INSERT INTO admission_campaigns (year, name) VALUES ($1, $2) RETURNING id',
    [year, `Прием ${year}/${year + 1}`],
  );
  return Number(inserted.rows[0].id);
}

async function findPlanId(client, result) {
  const rows = await client.query(
    `SELECT p.id
     FROM admission_plans p
     JOIN specialties_v2 s ON s.id = p.specialty_id
     JOIN education_bases eb ON eb.id = p.education_base_id
     JOIN funding_types ft ON ft.id = p.funding_type_id
     JOIN education_forms ef ON ef.id = p.form_id
     WHERE p.campaign_id = $1
       AND s.code = $2
       AND eb.code = $3
       AND ft.code = $4
       AND ef.code = $5
       AND ($6::int IS NULL OR p.places = $6::int)
     ORDER BY p.id
     LIMIT 1`,
    [
      result.campaignId,
      result.specialtyCode,
      String(result.educationBase),
      result.fundingType,
      result.formType,
      result.places ?? null,
    ],
  );

  return rows.rows[0]?.id ? Number(rows.rows[0].id) : null;
}

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();

  const response = await axios.get('https://natk.ru/abitur/info', { httpsAgent });
  const $ = cheerio.load(response.data);
  const pending = [];

  for (const heading of $('h1, h2, h3, h4').toArray()) {
    const headingText = normalizeText($(heading).text());
    const yearMatch = headingText.match(/^(\d{4})\s*год$/i);
    if (!yearMatch) continue;

    const campaignYear = Number(yearMatch[1]);
    const campaignId = await ensureCampaign(client, campaignYear);
    const context = {};

    $(heading)
      .nextUntil('h1, h2, h3, h4')
      .find('tr')
      .each((_, row) => {
        const cells = $(row)
          .find('th, td')
          .toArray()
          .map((cell) => normalizeText($(cell).text()));

        if (cells.length === 0) return;

        const label = cells[0];
        updateContext(label, context);

        const codeMatch = label.match(/\d{2}\.\d{2}\.\d{2}/);
        if (!codeMatch || !context.formType || !context.educationBase || !context.fundingType) return;

        pending.push({
          campaignId,
          campaignYear,
          specialtyCode: codeMatch[0],
          formType: context.formType,
          educationBase: context.educationBase,
          fundingType: context.fundingType,
          places: parseNullableInteger(cells[1]),
          applicationsCount: parseNullableInteger(cells[2]) ?? 0,
          competition: parseNullableNumber(cells[3]) ?? 0,
          accepted: parseNullableInteger(cells[4]),
          avgScore: parseNullableNumber(cells[5]),
          passingScore: parseNullableNumber(cells[6]),
        });
      });
  }

  const resolved = [];
  for (const item of pending) {
    const planId = await findPlanId(client, item);
    if (!planId) {
      console.warn(
        `Plan not found: ${item.campaignYear} ${item.specialtyCode}, base ${item.educationBase}, ${item.fundingType}, ${item.formType}`,
      );
      continue;
    }
    resolved.push({ ...item, planId });
  }

  const campaignIds = [...new Set(resolved.map((item) => item.campaignId))];

  await client.query('BEGIN');
  try {
    await client.query(
      `DELETE FROM admission_results r
       USING admission_plans p
       WHERE r.plan_id = p.id AND p.campaign_id = ANY($1::int[])`,
      [campaignIds],
    );

    for (const item of resolved) {
      await client.query(
        `INSERT INTO admission_results
          (plan_id, applications_count, competition, avg_score, passing_score, accepted, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [item.planId, item.applicationsCount, item.competition, item.avgScore, item.passingScore, item.accepted],
      );
    }

    await client.query(
      `INSERT INTO admission_results
        (plan_id, applications_count, competition, avg_score, passing_score, accepted, updated_at)
       SELECT p.id, 0, 0, NULL, NULL, NULL, NOW()
       FROM admission_plans p
       WHERE p.campaign_id = ANY($1::int[])
         AND NOT EXISTS (
           SELECT 1 FROM admission_results r WHERE r.plan_id = p.id
         )`,
      [campaignIds],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }

  console.log(`Parsed rows: ${pending.length}`);
  console.log(`Inserted rows: ${resolved.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
