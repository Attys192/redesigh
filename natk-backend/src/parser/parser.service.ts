import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, In, DataSource } from 'typeorm';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { SPECIALTIES_SEED_DATA } from '../../!!!specialties.data';
import {
  createHttpsAgent,
  getStandardHeaders,
  sleep,
  SLEEP_DURATION,
  cleanDocTitle,
  isJunkLink,
  toAbsoluteUrl,
  parseRussianDate,
  REGEX_PATTERNS,
  ParserLogger,
  getFullSizeImageUrl,
} from './parser.utils';

import { News } from '../entities/news.entity';
import { NewsImage } from '../entities/news-image.entity';
import { Staff } from '../entities/staff.entity';
import { StaffPosition } from '../entities/staff-position.entity';
import { Document } from '../entities/document.entity';
import { DocumentCategory } from '../entities/document-category.entity';
import { Company } from '../entities/company.entity';
import { Vacancy } from '../entities/vacancy.entity';
import { Schedule } from '../entities/schedule.entity';
import { Group } from '../entities/group.entity';
import { Specialty } from '../entities/specialty.entity';
import { Campus } from '../entities/campus.entity';
import { Subject } from '../entities/subject.entity';
import { Room } from '../entities/room.entity';
import { Department } from '../entities/department.entity';
import { Course } from '../entities/course.entity';

@Injectable()
export class ParserService implements OnModuleInit {
  private readonly logger = new ParserLogger(ParserService.name);
  private readonly runBackgroundParsers = process.env.RUN_BACKGROUND_PARSERS === 'true';
  private isParsing = false;
  private static readonly ADMISSION_DURATION_TO_MONTHS: Record<string, number> = {
    '1 год 10 месяцев': 22,
    '2 года 7 месяцев': 31,
    '2 года 10 месяцев': 34,
    '3 года 10 месяцев': 46,
  };
  private static readonly SPECIALTY_PROFILE_REFRESH_DAYS = 7;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(News) private newsRepo: Repository<News>,
    @InjectRepository(NewsImage) private newsImageRepo: Repository<NewsImage>,
    @InjectRepository(Staff) private staffRepo: Repository<Staff>,
    @InjectRepository(StaffPosition) private staffPositionRepo: Repository<StaffPosition>,
    @InjectRepository(Document) private docRepo: Repository<Document>,
    @InjectRepository(DocumentCategory) private docCatRepo: Repository<DocumentCategory>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(Vacancy) private vacancyRepo: Repository<Vacancy>,
    @InjectRepository(Schedule) private scheduleRepo: Repository<Schedule>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(Specialty) private specialtyRepo: Repository<Specialty>,
    @InjectRepository(Campus) private campusRepo: Repository<Campus>,
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(Department) private departmentRepo: Repository<Department>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
  ) {}

  async onModuleInit() {
    this.logger.log(
      `🚀 Сервер запущен и готов к работе! Автоматический парсинг ${this.runBackgroundParsers ? 'включен' : 'отключен'}.`
    );
    this.logger.log('💡 Чтобы запустить синхронизацию вручную, используйте POST запрос на /api/sync');

    if (!this.runBackgroundParsers) {
      this.logger.log('⏸️ Фоновые парсеры отключены (RUN_BACKGROUND_PARSERS != true).');
      return;
    }

    // Запускаем в фоне, чтобы не блокировать запуск сервера
    this.seedSpecialties()
      .then(() => this.parseAdmissionPlans())
      .then(() => this.parseAdmissionResults())
      .then(() => this.parsePassingScores())
      .then(() => this.seedAdmissionDocuments())
      .then(() => this.parseSchedule())
      .catch(err => this.logger.error(`❌ Ошибка при инициализации данных: ${err.message}`));
  }

  @Cron('0 2 * * *')
  async parsePassingScores() {
    if (!this.runBackgroundParsers) return;
    this.logger.log('📊 Начинаем точный парсинг проходных баллов с сайта НАТК...');
    const httpsAgent = createHttpsAgent();
    let updatedCount = 0;

    try {
      const response = await axios.get('https://natk.ru/abitur/info', { httpsAgent });
      const $ = cheerio.load(response.data);

      // Ищем строки специальностей в таблице за последний год (обычно первая таблица)
      // Класс pk_gFy2s_5 используется для строк со специальностями
      const rows = $('tr.pk_gFy2s_5');
      
      for (const row of rows.toArray()) {
        const $tds = $(row).find('td');
        if ($tds.length < 2) continue;

        // 1. Код специальности обычно в первой ячейке
        const firstTdText = $tds.first().text().trim();
        const codeMatch = firstTdText.match(/\d{2}\.\d{2}\.\d{2}/);
        
        // 2. Проходной балл — это ВСЕГДА последняя ячейка в строке
        const lastTdText = $tds.last().text().trim().replace(',', '.');
        const scoreMatch = lastTdText.match(/[3-5]\.\d{2}/);

        if (codeMatch && scoreMatch) {
          const code = codeMatch[0];
          const score = parseFloat(scoreMatch[0]);

          try {
            // Обновляем все специальности с этим кодом (может быть в разных корпусах)
            const specialties = await this.specialtyRepo.find({ where: { code } });
            for (const specialty of specialties) {
              specialty.passingScore = score;
              await this.specialtyRepo.save(specialty);
              updatedCount++;
              this.logger.debug(`✅ Обновлен балл для ${code} (${specialty.id}): ${score}`);
            }
          } catch (dbErr: any) {
            this.logger.error(`❌ Ошибка обновления балла для ${code}: ${dbErr.message}`);
          }
        }
      }

      this.logger.log(`📈 Точный парсинг завершен. Обновлено специальностей: ${updatedCount}`);
    } catch (error: any) {
      this.logger.error(`❌ Ошибка при парсинге проходных баллов: ${error.message}`);
    }
  }

  async runFullSync(type?: string) {
    if (this.isParsing) {
      this.logger.warn('⚠️ Синхронизация уже запущена! Повторный запуск отклонен.');
      return { status: 'already_running', message: 'Sync is already in progress' };
    }

    this.isParsing = true;
    this.logger.log(`🔄 Запущена синхронизация (${type || 'полная'}) данных с сайтом НАТК...`);
    
    // Запускаем асинхронно, чтобы не блокировать ответ API
    this.executeSyncProcess(type).finally(() => {
      this.isParsing = false;
    });

    return { status: 'started', message: `${type || 'Full'} sync process has been initiated` };
  }

  private async executeSyncProcess(type?: string) {
    try {
      if (!type || type === 'specialties') {
        await this.seedSpecialties();
      }
      if (type === 'specialty-profiles') {
        await this.parseSpecialtyProfiles();
      }
      if (!type || type === 'admission' || type === 'specialties') {
        await this.parseAdmissionPlans();
        await this.parseAdmissionResults();
      }
      if (!type || type === 'specialties') {
        await this.parsePassingScores();
      }
      if (!type || type === 'news') await this.parseNatkNews();
      if (!type || type === 'staff') await this.parseStaff();
      if (!type || type === 'docs') {
        await this.seedAdmissionDocuments();
        await this.parseDocuments();
      }
      if (!type || type === 'vacancies') await this.parseVacancies();
      if (!type || type === 'schedule') await this.parseSchedule();
      if (!type || type === 'structure') await this.parseStructure();
      
      this.logger.log(`✅ Синхронизация (${type || 'полная'}) успешно завершена!`);
    } catch (error: any) {
      this.logger.error(`❌ Ошибка во время синхронизации: ${error.message}`);
    }
  }

  getParsingStatus() {
    return { isParsing: this.isParsing };
  }

  @Cron('0 15 3 * * 1')
  async parseSpecialtyProfilesCron() {
    if (!this.runBackgroundParsers) return;
    await this.parseSpecialtyProfiles();
  }

  async parseSpecialtyProfiles(options: { force?: boolean } = {}) {
    this.logger.log('📘 Начинаем проверку подробных страниц специальностей...');

    try {
      await this.ensureSpecialtyProfilesTable();

      const httpsAgent = createHttpsAgent();
      const response = await axios.get('https://natk.ru/abitur/list', {
        httpsAgent,
        headers: getStandardHeaders(),
      });
      const $ = cheerio.load(response.data);
      const links = this.extractSpecialtyProfileLinks($);

      if (links.length === 0) {
        throw new Error('Не найдены ссылки на подробные страницы специальностей');
      }

      let checkedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const link of links) {
        const specialtyRows = await this.dataSource.query('SELECT id FROM specialties_v2 WHERE code = $1 LIMIT 1', [
          link.code,
        ]);
        const specialtyId = specialtyRows[0]?.id ? Number(specialtyRows[0].id) : null;

        if (!specialtyId) {
          this.logger.warn(`⚠️ specialties_v2 не содержит код ${link.code}, профиль пропущен`);
          continue;
        }

        const existingRows = await this.dataSource.query(
          'SELECT id, content_hash, last_checked_at FROM specialty_profiles WHERE specialty_id = $1 LIMIT 1',
          [specialtyId],
        );
        const existing = existingRows[0];

        if (!options.force && existing?.last_checked_at && !this.isProfileStale(existing.last_checked_at)) {
          skippedCount++;
          continue;
        }

        checkedCount++;
        const page = await axios.get(link.url, {
          httpsAgent,
          headers: getStandardHeaders(),
        });
        const page$ = cheerio.load(page.data);
        const profile = this.extractSpecialtyProfile(page$, link);

        if (!profile.fullText || profile.fullText.length < 100) {
          this.logger.warn(`⚠️ Подробная страница ${link.code} слишком короткая, профиль пропущен`);
          continue;
        }

        if (existing?.content_hash === profile.contentHash) {
          await this.dataSource.query('UPDATE specialty_profiles SET last_checked_at = NOW() WHERE id = $1', [
            existing.id,
          ]);
        } else {
          await this.dataSource.query(
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
          updatedCount++;
        }

        await sleep(SLEEP_DURATION.SHORT);
      }

      this.logger.log(
        `✅ Профили специальностей проверены. Проверено: ${checkedCount}, обновлено: ${updatedCount}, свежих пропущено: ${skippedCount}`,
      );
    } catch (error: any) {
      this.logger.error(`❌ Ошибка при парсинге профилей специальностей: ${error.message}`);
    }
  }

  private async ensureSpecialtyProfilesTable() {
    await this.dataSource.query(
      `CREATE TABLE IF NOT EXISTS specialty_profiles (
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
       )`,
    );
  }

  private extractSpecialtyProfileLinks($: cheerio.CheerioAPI) {
    const linksByCode = new Map<string, { code: string; url: string }>();

    $('a[href]').each((_, element) => {
      const text = this.normalizeText($(element).text());
      const href = $(element).attr('href') ?? '';
      const codeMatch = text.match(/\d{2}\.\d{2}\.\d{2}/) ?? href.match(/\d{2}[.-]\d{2}[.-]\d{2}/);
      if (!codeMatch) return;

      const code = codeMatch[0].replace(/-/g, '.');
      const absoluteUrl = toAbsoluteUrl(href);
      const existing = linksByCode.get(code);

      if (!existing || absoluteUrl.includes('/sveden/education/')) {
        linksByCode.set(code, { code, url: absoluteUrl });
      }
    });

    return Array.from(linksByCode.values()).sort((a, b) => a.code.localeCompare(b.code));
  }

  private extractSpecialtyProfile(
    $: cheerio.CheerioAPI,
    link: { code: string; url: string },
  ): {
    sourceUrl: string;
    description: string | null;
    fullText: string;
    contentHtml: string;
    disciplines: string[];
    professionalAreas: string[];
    skills: string[];
    careerOptions: string[];
    contentHash: string;
    sourceUpdatedAt: Date | null;
  } {
    const body = $('[itemprop=articleBody]').first();
    const content = body.length ? body : $('.item-page').first();
    const contentHtml = content.html()?.trim() ?? '';
    const fullText = this.normalizeText(content.text());
    const paragraphs = content
      .find('p')
      .toArray()
      .map((p) => this.normalizeText($(p).text()))
      .filter((text) => text.length > 40);

    const description = paragraphs.find((text) => !text.includes('Область профессиональной деятельности')) ?? null;
    const disciplines = this.extractListAfterText($, content, ['Студенты изучают', 'специальные дисциплины']);
    const professionalAreas = this.extractListAfterText($, content, [
      'Область профессиональной деятельности',
      'включает в себя',
    ]);
    const skills = this.extractListAfterText($, content, ['Выпускник', 'должен']);
    const careerOptions = this.extractListAfterText($, content, ['может работать', 'должности', 'профессии']);
    const updatedText = this.normalizeText($('.item-page, #content').first().text());
    const updatedMatch = updatedText.match(/Обновлено:\s*(\d{2})\.(\d{2})\.(\d{4})/i);
    const sourceUpdatedAt = updatedMatch
      ? new Date(Number(updatedMatch[3]), Number(updatedMatch[2]) - 1, Number(updatedMatch[1]))
      : null;
    const contentHash = createHash('sha256').update(fullText).digest('hex');

    return {
      sourceUrl: link.url,
      description,
      fullText,
      contentHtml,
      disciplines,
      professionalAreas,
      skills,
      careerOptions,
      contentHash,
      sourceUpdatedAt,
    };
  }

  private extractListAfterText(
    $: cheerio.CheerioAPI,
    content: cheerio.Cheerio<any>,
    markers: string[],
  ): string[] {
    const markerElement = content
      .find('p, div, h2, h3, h4')
      .toArray()
      .find((element) => {
        const text = this.normalizeText($(element).text()).toLowerCase();
        return markers.some((marker) => text.includes(marker.toLowerCase()));
      });

    if (!markerElement) return [];

    const list = $(markerElement).nextAll('ul, ol').first();
    if (!list.length) return [];

    return list
      .find('li')
      .toArray()
      .map((li) => this.normalizeText($(li).text()).replace(/[.;]+$/, ''))
      .filter(Boolean);
  }

  private isProfileStale(lastCheckedAt: Date | string): boolean {
    const checkedAt = new Date(lastCheckedAt).getTime();
    if (!Number.isFinite(checkedAt)) return true;

    const refreshMs = ParserService.SPECIALTY_PROFILE_REFRESH_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - checkedAt > refreshMs;
  }

  async seedSpecialties() {
    this.logger.log('🌱 Загружаем справочник специальностей и корпусов...');
    for (const data of SPECIALTIES_SEED_DATA) {
      try {
        // 1. Находим или создаем кампус
        let campus = await this.campusRepo.findOne({ where: { address: data.campus } });
        if (!campus) {
          campus = this.campusRepo.create({ address: data.campus });
          await this.campusRepo.save(campus);
        }

        // 2. Находим или создаем специальность (проверяем код И кампус)
        let specialty = await this.specialtyRepo.findOne({ 
          where: { code: data.code, campus: { id: campus.id } },
          relations: ['campus']
        });

        if (!specialty) {
          specialty = this.specialtyRepo.create({
            code: data.code,
            title: data.title,
            campus,
            passingScore: (data as any).passingScore,
            budgetPlaces: (data as any).budgetPlaces ?? 25,
          });
        } else {
          // Обновляем существующую специальность новыми данными
          specialty.title = data.title;
          specialty.passingScore = (data as any).passingScore;
          specialty.budgetPlaces = (data as any).budgetPlaces ?? specialty.budgetPlaces ?? 25;
        }
        await this.specialtyRepo.save(specialty);
      } catch (err: any) {
        this.logger.error(`Ошибка сидирования специальности ${data.code}: ${err.message}`);
      }
    }
    this.logger.log('✅ Сидирование специальностей завершено!');
  }

  async parseAdmissionPlans() {
    this.logger.log('📚 Начинаем парсинг планов приема с /abitur/list...');

    try {
      const httpsAgent = createHttpsAgent();
      const response = await axios.get('https://natk.ru/abitur/list', { httpsAgent });
      const $ = cheerio.load(response.data);

      const campaignYear = this.extractAdmissionCampaignYear($);
      if (!campaignYear) {
        throw new Error('Не удалось определить год приемной кампании на странице /abitur/list');
      }

      const [campaignId, specialtyMap, campusMap, educationBaseMap, fundingTypeMap, formMap] = await Promise.all([
        this.ensureAdmissionCampaign(campaignYear),
        this.loadSpecialtyV2Map(),
        this.loadCampusMap(),
        this.loadEducationBaseMap(),
        this.loadFundingTypeMap(),
        this.loadFormMap(),
      ]);

      const campusBySpecialtyKey = this.extractCampusAssignments($);
      const plans = this.extractAdmissionPlans($, campusBySpecialtyKey, specialtyMap, campusMap);

      if (plans.length === 0) {
        throw new Error('Парсер не нашел ни одной записи плана приема на странице /abitur/list');
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.query(
          `DELETE FROM admission_results r
           USING admission_plans p
           WHERE r.plan_id = p.id AND p.campaign_id = $1`,
          [campaignId],
        );
        await queryRunner.query('DELETE FROM admission_plans WHERE campaign_id = $1', [campaignId]);

        for (const plan of plans) {
          const educationBaseId = educationBaseMap.get(String(plan.educationBase));
          const fundingTypeId = fundingTypeMap.get(plan.fundingType);
          const formId = formMap.get(plan.formType);

          if (!educationBaseId) {
            this.logger.warn(`⚠️ education_base_id не найден для кода ${plan.educationBase}`);
            continue;
          }

          if (!fundingTypeId) {
            this.logger.warn(`⚠️ funding_type_id не найден для кода ${plan.fundingType}`);
            continue;
          }

          if (!formId) {
            this.logger.warn(`⚠️ form_id не найден для кода ${plan.formType}`);
            continue;
          }

          await queryRunner.query(
            `INSERT INTO admission_plans
              (campaign_id, specialty_id, campus_id, education_base_id, funding_type_id, form_id, duration_months, places)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              campaignId,
              plan.specialtyId,
              plan.campusId,
              educationBaseId,
              fundingTypeId,
              formId,
              plan.durationMonths,
              plan.places,
            ],
          );
        }

        await queryRunner.query(
          `INSERT INTO admission_results
            (plan_id, applications_count, competition, avg_score, passing_score, accepted, updated_at)
           SELECT p.id, 0, 0, NULL, NULL, NULL, NOW()
           FROM admission_plans p
           WHERE p.campaign_id = $1`,
          [campaignId],
        );

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

      this.logger.log(`✅ Планы приема ${campaignYear} года обновлены. Загружено записей: ${plans.length}`);
    } catch (error: any) {
      this.logger.error(`❌ Ошибка при парсинге планов приема: ${error.message}`);
    }
  }

  @Cron('0 0 8,14,20 * * *')
  async parseAdmissionResults() {
    this.logger.log('📊 Начинаем парсинг сведений о приеме с /abitur/info...');

    try {
      const httpsAgent = createHttpsAgent();
      const response = await axios.get('https://natk.ru/abitur/info', { httpsAgent });
      const $ = cheerio.load(response.data);
      const parsedResults = await this.extractAdmissionResults($);

      if (parsedResults.length === 0) {
        throw new Error('Парсер не нашел ни одной строки результатов приема на странице /abitur/info');
      }

      const campaignIds = [...new Set(parsedResults.map((result) => result.campaignId))];
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.query(
          `DELETE FROM admission_results r
           USING admission_plans p
           WHERE r.plan_id = p.id AND p.campaign_id = ANY($1::int[])`,
          [campaignIds],
        );

        for (const result of parsedResults) {
          await queryRunner.query(
            `INSERT INTO admission_results
              (plan_id, applications_count, competition, avg_score, passing_score, accepted, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              result.planId,
              result.applicationsCount,
              result.competition,
              result.avgScore,
              result.passingScore,
              result.accepted,
            ],
          );
        }

        await queryRunner.query(
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

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

      this.logger.log(`✅ Сведения о приеме обновлены. Загружено записей: ${parsedResults.length}`);
    } catch (error: any) {
      this.logger.error(`❌ Ошибка при парсинге сведений о приеме: ${error.message}`);
    }
  }

  private async extractAdmissionResults($: cheerio.CheerioAPI): Promise<
    Array<{
      campaignId: number;
      planId: number;
      applicationsCount: number;
      competition: number;
      avgScore: number | null;
      passingScore: number | null;
      accepted: number | null;
    }>
  > {
    type PendingAdmissionResult = {
      campaignId: number;
      planId: number;
      applicationsCount: number;
      competition: number;
      avgScore: number | null;
      passingScore: number | null;
      accepted: number | null;
      specialtyCode: string;
      formType: 'full-time' | 'part-time';
      educationBase: 9 | 11;
      fundingType: 'budget' | 'paid';
      places?: number;
    };

    const results: PendingAdmissionResult[] = [];

    const headings = $('h1, h2, h3, h4').toArray();

    for (const heading of headings) {
      const headingText = this.normalizeText($(heading).text());
      const yearMatch = headingText.match(/^(\d{4})\s*год$/i);
      if (!yearMatch) continue;

      const campaignYear = Number(yearMatch[1]);
      const campaignId = await this.ensureAdmissionCampaign(campaignYear);
      const context: {
        formType?: 'full-time' | 'part-time';
        educationBase?: 9 | 11;
        fundingType?: 'budget' | 'paid';
      } = {};

      $(heading)
        .nextUntil('h1, h2, h3, h4')
        .find('tr')
        .each((_, row) => {
          const cells = $(row)
            .find('th, td')
            .toArray()
            .map((cell) => this.normalizeText($(cell).text()));

          if (cells.length === 0) return;

          const label = cells[0];
          this.updateAdmissionResultContext(label, context);

          const codeMatch = label.match(/\d{2}\.\d{2}\.\d{2}/);
          if (!codeMatch || !context.formType || !context.educationBase || !context.fundingType) return;

          const places = this.parseNullableInteger(cells[1]);
          const applicationsCount = this.parseNullableInteger(cells[2]) ?? 0;
          const competition = this.parseNullableNumber(cells[3]) ?? 0;
          const accepted = this.parseNullableInteger(cells[4]);
          const avgScore = this.parseNullableNumber(cells[5]);
          const passingScore = this.parseNullableNumber(cells[6]);

          results.push({
            campaignId,
            planId: 0,
            applicationsCount,
            competition,
            avgScore,
            passingScore,
            accepted,
            specialtyCode: codeMatch[0],
            formType: context.formType,
            educationBase: context.educationBase,
            fundingType: context.fundingType,
            ...(places !== null ? { places } : {}),
          });
        });
    }

    const resolvedResults: Array<{
      campaignId: number;
      planId: number;
      applicationsCount: number;
      competition: number;
      avgScore: number | null;
      passingScore: number | null;
      accepted: number | null;
    }> = [];

    for (const result of results) {
      const planId = await this.getOrCreatePlanId(result);
      if (!planId) continue;

      resolvedResults.push({
        campaignId: result.campaignId,
        planId,
        applicationsCount: result.applicationsCount,
        competition: result.competition,
        avgScore: result.avgScore,
        passingScore: result.passingScore,
        accepted: result.accepted,
      });
    }

    return resolvedResults;
  }

  private updateAdmissionResultContext(
    text: string,
    context: {
      formType?: 'full-time' | 'part-time';
      educationBase?: 9 | 11;
      fundingType?: 'budget' | 'paid';
    },
  ) {
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

 private async getOrCreatePlanId(result: {
    campaignId: number;
    specialtyCode: string;
    formType: 'full-time' | 'part-time';
    educationBase: 9 | 11;
    fundingType: 'budget' | 'paid';
    places?: number; // Это поле теперь критически важно
  }): Promise<number | null> {
    
    // 1. Пытаемся найти существующий план, ГДЕ СОВПАДАЕТ КОЛИЧЕСТВО МЕСТ
    const rows = await this.dataSource.query(
      `SELECT p.id FROM admission_plans p
       JOIN specialties_v2 s ON s.id = p.specialty_id
       JOIN education_bases eb ON eb.id = p.education_base_id
       JOIN funding_types ft ON ft.id = p.funding_type_id
       JOIN education_forms ef ON ef.id = p.form_id
       WHERE p.campaign_id = $1 
         AND s.code::text = $2::text
         AND (eb.code::text = $3::text OR eb.code::text = ($3 || ' кл.'))
         AND ft.code::text = $4::text 
         AND ef.code::text = $5::text
         AND p.places = $6 -- Ищем именно этот план по кол-ву мест
       LIMIT 1`,
      [
        result.campaignId, 
        result.specialtyCode, 
        String(result.educationBase), 
        result.fundingType, 
        result.formType,
        result.places || 25 // Сравниваем места
      ]
    );

    if (rows[0]?.id) return Number(rows[0].id);

    // 2. Если такого плана (с таким кол-вом мест) нет — создаем новый
    try {
      this.logger.log(`🛠️ Создаю уникальный план: ${result.specialtyCode}, ${result.places} мест`);

      const spec = await this.dataSource.query(`SELECT id FROM specialties_v2 WHERE code = $1 LIMIT 1`, [result.specialtyCode]);
      if (!spec[0]) return null;

      const eb = await this.dataSource.query(`SELECT id FROM education_bases WHERE code::text = $1 OR code::text = ($1 || ' кл.') LIMIT 1`, [String(result.educationBase)]);
      const ft = await this.dataSource.query(`SELECT id FROM funding_types WHERE code::text = $1 LIMIT 1`, [result.fundingType]);
      const ef = await this.dataSource.query(`SELECT id FROM education_forms WHERE code::text = $1 LIMIT 1`, [result.formType]);

      const campusId = result.specialtyCode.startsWith('09') || result.specialtyCode.startsWith('25') ? 1 : 2;

      const newPlan = await this.dataSource.query(
        `INSERT INTO admission_plans 
         (campaign_id, specialty_id, campus_id, education_base_id, funding_type_id, form_id, duration_months, places)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          result.campaignId, 
          spec[0].id, 
          campusId, 
          eb[0]?.id || 1, 
          ft[0]?.id || 1, 
          ef[0]?.id || 1, 
          result.educationBase === 9 ? 46 : 34, 
          result.places || 25 // Сохраняем переданные места
        ]
      );

      return Number(newPlan[0].id);
    } catch (err: any) {
      this.logger.error(`❌ Ошибка авто-создания: ${err.message}`);
      return null;
    }
  }

  private parseNullableInteger(value?: string): number | null {
    if (!value) return null;
    const normalized = value.replace(/\s+/g, '').replace(/[^\d-]/g, '');
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseNullableNumber(value?: string): number | null {
    if (!value) return null;
    const normalized = value.trim().replace(',', '.');
    if (!normalized || /^[xх-]$/i.test(normalized)) return null;
    const match = normalized.match(/\d+(?:\.\d+)?/);
    if (!match) return null;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private extractAdmissionCampaignYear($: cheerio.CheerioAPI): number | null {
    const text = this.normalizeText($('body').text());
    const match = text.match(/прием на (\d{4})\/\d{4} учебный год/i);
    return match ? Number(match[1]) : null;
  }

  private extractCampusAssignments($: cheerio.CheerioAPI): Map<string, string> {
    const campusByKey = new Map<string, string>();

    $('h1, h2, h3, h4, h5, h6').each((_, heading) => {
      const headingText = this.normalizeText($(heading).text());
      const campusMatch = headingText.match(/по адресу\s+(.+)$/i);
      if (!campusMatch) return;

      const campusName = campusMatch[1].trim();
      const list = $(heading).nextAll('ol, ul').first();
      if (!list.length) return;

      list.find('li').each((_, li) => {
        const itemText = this.normalizeText($(li).text());
        const codeMatch = itemText.match(/\d{2}\.\d{2}\.\d{2}/);
        if (!codeMatch) return;

        const educationBase = itemText.includes('среднего общего образования')
          ? 11
          : itemText.includes('основного общего образования')
            ? 9
            : null;

        if (educationBase !== null) {
          campusByKey.set(`${codeMatch[0]}|${educationBase}`, campusName);
        }

        if (!campusByKey.has(`${codeMatch[0]}|any`)) {
          campusByKey.set(`${codeMatch[0]}|any`, campusName);
        }
      });
    });

    return campusByKey;
  }

  private extractAdmissionPlans(
    $: cheerio.CheerioAPI,
    campusBySpecialtyKey: Map<string, string>,
    specialtyMap: Map<string, number>,
    campusMap: Map<string, number>,
  ) {
    const plans: Array<{
      specialtyId: number;
      campusId: number | null;
      educationBase: 9 | 11;
      fundingType: 'budget' | 'paid';
      formType: 'full-time' | 'part-time';
      durationMonths: number;
      places: number;
    }> = [];

    $('p').each((_, paragraph) => {
      const contextText = this.normalizeText($(paragraph).text());
      if (!contextText.includes('объявляется прием')) return;

      const context = this.parseAdmissionContext(contextText);
      if (!context) return;

      const list = $(paragraph).next('ul');
      if (!list.length) return;

      list.find('li').each((_, li) => {
        const parsed = this.parseAdmissionPlanItem(this.normalizeText($(li).text()));
        if (!parsed) return;

        const specialtyId = specialtyMap.get(parsed.code);
        if (!specialtyId) {
          this.logger.warn(`⚠️ specialty_id не найден в specialties_v2 для кода ${parsed.code}`);
          return;
        }

        const campusName =
          campusBySpecialtyKey.get(`${parsed.code}|${context.educationBase}`) ??
          campusBySpecialtyKey.get(`${parsed.code}|any`) ??
          null;

        if (!campusName) {
          this.logger.warn(`⚠️ campus_id не определен для ${parsed.code} (${context.educationBase} классов)`);
        }

        const campusId = campusName ? campusMap.get(campusName) ?? null : null;
        if (campusName && campusId === null) {
          this.logger.warn(`⚠️ campus_id не найден в campuses для "${campusName}"`);
        }

        plans.push({
          specialtyId,
          campusId,
          educationBase: context.educationBase,
          fundingType: context.fundingType,
          formType: context.formType,
          durationMonths: context.durationMonths,
          places: parsed.places,
        });
      });
    });

    return plans;
  }

  private parseAdmissionContext(text: string): {
    educationBase: 9 | 11;
    fundingType: 'budget' | 'paid';
    formType: 'full-time' | 'part-time';
    durationMonths: number;
  } | null {
    const educationBase = text.includes('9 классов') ? 9 : text.includes('11 классов') ? 11 : null;
    const formType = text.includes('заочной формы') ? 'part-time' : text.includes('очной формы') ? 'full-time' : null;
    const fundingType =
      text.includes('платно') || /за сч[её]т средств физических/i.test(text)
        ? 'paid'
        : text.includes('бюджет')
          ? 'budget'
          : null;

    const durationLabel = Object.keys(ParserService.ADMISSION_DURATION_TO_MONTHS).find((label) => text.includes(label));
    const durationMonths = durationLabel ? ParserService.ADMISSION_DURATION_TO_MONTHS[durationLabel] : null;

    if (!educationBase || !formType || !fundingType || durationMonths === null) {
      this.logger.warn(`⚠️ Не удалось полностью распарсить контекст плана приема: ${text}`);
      return null;
    }

    return { educationBase, fundingType, formType, durationMonths };
  }

  private parseAdmissionPlanItem(text: string): { code: string; title: string; places: number } | null {
    const codeMatch = text.match(/\d{2}\.\d{2}\.\d{2}/);
    const placesMatch = text.match(/(\d+)\s*мест/i);
    if (!codeMatch || !placesMatch) return null;

    const code = codeMatch[0];
    const places = Number(placesMatch[1]);
    const title = text
      .replace(code, '')
      .replace(/-\s*\d+\s*мест;?/i, '')
      .replace(/^[\s\-–—;:]+/, '')
      .replace(/[;.]$/, '')
      .trim();

    return { code, title, places };
  }

  private async ensureAdmissionCampaign(year: number): Promise<number> {
    const existing = await this.dataSource.query(
      'SELECT id FROM admission_campaigns WHERE year = $1 LIMIT 1',
      [year],
    );

    if (existing[0]?.id) {
      return Number(existing[0].id);
    }

    const inserted = await this.dataSource.query(
      'INSERT INTO admission_campaigns (year, name) VALUES ($1, $2) RETURNING id',
      [year, `Прием ${year}/${year + 1}`],
    );

    return Number(inserted[0].id);
  }

  private async loadSpecialtyV2Map(): Promise<Map<string, number>> {
    const rows = await this.dataSource.query('SELECT id, code FROM specialties_v2');
    return new Map(rows.map((row: { id: number | string; code: string }) => [row.code, Number(row.id)]));
  }

  private async loadEducationBaseMap(): Promise<Map<string, number>> {
    return this.loadLookupMap({
      tableCandidates: ['education_bases'],
      valueColumnCandidates: ['code'],
      normalizeKey: (value) => String(value).trim(),
    });
  }

  private async loadFundingTypeMap(): Promise<Map<string, number>> {
    return this.loadLookupMap({
      tableCandidates: ['funding_types'],
      valueColumnCandidates: ['code'],
      normalizeKey: (value) => String(value).trim().toLowerCase(),
    });
  }

  private async loadFormMap(): Promise<Map<string, number>> {
    return this.loadLookupMap({
      tableCandidates: ['education_forms'],
      valueColumnCandidates: ['code'],
      normalizeKey: (value) => String(value).trim().toLowerCase(),
    });
  }

  private async loadCampusMap(): Promise<Map<string, number>> {
    const campusNameColumn = await this.resolveExistingColumnName('campuses', ['name', 'address']);

    if (!campusNameColumn) {
      throw new Error('В таблице campuses не найдено ни одного подходящего столбца для названия корпуса (name/address)');
    }

    const rows = await this.dataSource.query(`SELECT id, ${campusNameColumn} AS campus_name FROM campuses`);
    return new Map(
      rows.map((row: { id: number | string; campus_name: string }) => [row.campus_name, Number(row.id)]),
    );
  }

  private async loadLookupMap(options: {
    tableCandidates: string[];
    valueColumnCandidates: string[];
    normalizeKey?: (value: unknown) => string;
  }): Promise<Map<string, number>> {
    const tableName = await this.resolveExistingTableName(options.tableCandidates);
    if (!tableName) {
      throw new Error(`Не найдена lookup-таблица. Проверены варианты: ${options.tableCandidates.join(', ')}`);
    }

    const valueColumn = await this.resolveExistingColumnName(tableName, options.valueColumnCandidates);
    if (!valueColumn) {
      throw new Error(
        `В таблице ${tableName} не найден подходящий столбец значения. Проверены варианты: ${options.valueColumnCandidates.join(', ')}`,
      );
    }

    const rows = await this.dataSource.query(`SELECT id, ${valueColumn} AS lookup_value FROM ${tableName}`);
    const normalizeKey = options.normalizeKey ?? ((value: unknown) => String(value));

    return new Map(
      rows.map((row: { id: number | string; lookup_value: unknown }) => [
        normalizeKey(row.lookup_value),
        Number(row.id),
      ]),
    );
  }

  private async resolveExistingTableName(candidates: string[]): Promise<string | null> {
    const rows = await this.dataSource.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'`,
    );

    const availableTables = new Set(
      rows.map((row: { table_name: string }) => row.table_name.toLowerCase()),
    );

    return candidates.find((table) => availableTables.has(table.toLowerCase())) ?? null;
  }

  private async resolveExistingColumnName(tableName: string, candidates: string[]): Promise<string | null> {
    const rows = await this.dataSource.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`,
      [tableName],
    );

    const availableColumns = new Set(
      rows.map((row: { column_name: string }) => row.column_name.toLowerCase()),
    );

    return candidates.find((column) => availableColumns.has(column.toLowerCase())) ?? null;
  }

  private normalizeText(text: string): string {
    return text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Для тестов запускаем раз в 5 минут
  @Cron('0 */5 * * * *')
  async parseNatkNews() {
    if (!this.runBackgroundParsers) return;
    this.logger.log('🕵️‍♂️ Парсер проснулся! Собираем ссылки на новости...');

    try {
      // Игнорируем ошибку сертификата Минцифры
      const httpsAgent = createHttpsAgent();
      
      const response = await axios.get('https://natk.ru/news', { httpsAgent });
      const html = response.data;
      const $ = cheerio.load(html);

      const newsList: { title: string; url: string; date: string }[] =[];

      // 1. Собираем список всех новостей с главной страницы
      $('table tbody tr').each((index, element) => {
        if (index === 0) return;

        const titleElement = $(element).find('td a');
        const title = titleElement.text().trim();
        const link = titleElement.attr('href');
        const dateText = $(element).find('td').last().text().trim();

        if (title && link) {
          newsList.push({
            title: title,
            url: `https://natk.ru${link}`,
            date: dateText,
          });
        }
      });

      this.logger.log(`🔗 Найдено ${newsList.length} ссылок. Начинаем глубокий парсинг...`);

      // ОБНОВЛЕННЫЙ ТИП С МАССИВОМ ДОП. КАРТИНОК
      const fullNewsData: { 
        title: string; 
        url: string; 
        date: string; 
        contentHtml: string; 
        mainImageUrl: string | null; 
        additionalImages: string[]; 
      }[] =[];

      // 2. Идем циклом ВНУТРЬ каждой новости
      for (const newsItem of newsList) {
        this.logger.log(`➡️ Заходим в новость: ${newsItem.title}`);
        
        try {
          const innerResponse = await axios.get(newsItem.url, { httpsAgent });
          const inner$ = cheerio.load(innerResponse.data);

          // 1. Ищем текст новости (пробуем разные варианты контейнеров)
          const contentHtml = inner$('div[itemprop="articleBody"]').html() || 
                              inner$('.item-page').html() || 
                              inner$('article').html() || 
                              '<p>Текст новости не найден</p>';

          // 2. ИЩЕМ КАРТИНКИ ИЗ ГАЛЕРЕИ (Твоя находка!)
          const images: string[] =[];

          // Проходимся по всем ссылкам внутри галереи sigplus
          inner$('.sigplus-gallery a').each((i, el) => {
            const href = inner$(el).attr('href');
            if (href) {
              // Добавляем домен, если ссылка относительная (начинается с /)
              const fullUrl = href.startsWith('http') ? href : `https://natk.ru${href}`;
              images.push(fullUrl);
            }
          });

          // Если галереи (карусели) нет, ищем просто одиночную картинку в тексте
          if (images.length === 0) {
            const fallbackImg = inner$('div[itemprop="articleBody"] img').first().attr('src') || 
                                inner$('.item-page img').first().attr('src');
            if (fallbackImg) {
              const fullUrl = fallbackImg.startsWith('http') ? fallbackImg : `https://natk.ru${fallbackImg}`;
              images.push(fullUrl);
            }
          }

          // 3. Распределяем картинки: первая - главная, остальные - в массив
          const mainImageUrl = images.length > 0 ? images[0] : null; 
          const additionalImages = images.length > 1 ? images.slice(1) :[]; 

          // Добавляем собранные данные в наш итоговый массив
          fullNewsData.push({
            title: newsItem.title,
            url: newsItem.url,
            date: newsItem.date,
            contentHtml: contentHtml.trim(),
            mainImageUrl: mainImageUrl,
            additionalImages: additionalImages,
          });

          // ПАУЗА 1.5 секунды (Соблюдаем этику парсинга)
          await sleep(SLEEP_DURATION.MEDIUM);

        } catch (innerError: any) {
          this.logger.error(`❌ Ошибка при заходе в новость ${newsItem.url}: ${innerError.message}`);
        }
      }

      this.logger.log(`✅ Глубокий парсинг завершен! Успешно собрано: ${fullNewsData.length} шт.`);
      
      // СОХРАНЕНИЕ В БД
      for (const data of fullNewsData) {
        try {
          // Проверяем, есть ли уже такая новость по URL
          let news = await this.newsRepo.findOne({ where: { url: data.url } });
          
          if (!news) {
            // Пытаемся распарсить реальную дату новости (например "16.03.2026")
            let publishedDate = new Date();
            const dateParts = data.date.split('.');
            if (dateParts.length === 3) {
              const day = parseInt(dateParts[0], 10);
              const month = parseInt(dateParts[1], 10) - 1;
              const year = parseInt(dateParts[2], 10);
              if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                publishedDate = new Date(year, month, day);
              }
            }

            news = this.newsRepo.create({
              title: data.title,
              url: data.url,
              publishedDate: publishedDate,
              contentHtml: data.contentHtml,
              mainImageUrl: data.mainImageUrl ?? undefined,
            });
            await this.newsRepo.save(news);

            // Сохраняем доп. картинки
            if (data.additionalImages.length > 0) {
              const images = data.additionalImages.map(imgUrl => 
                this.newsImageRepo.create({ imageUrl: imgUrl, news: news as News })
              );
              await this.newsImageRepo.save(images);
            }
          }
        } catch (dbError: any) {
          this.logger.error(`❌ Ошибка сохранения новости в БД: ${dbError.message}`);
        }
      }

    } catch (error: any) {
      this.logger.error(`❌ Общая ошибка парсера: ${error.message}`);
    }
  }
// Запускаем раз в сутки ночью (в 3:00)
  @Cron('0 3 * * *')
  async parseStaff() {
    if (!this.runBackgroundParsers) return;
    this.logger.log('👨‍🏫 Начинаем глубокий парсинг сотрудников (Руководство и Педагоги)...');

    const httpsAgent = createHttpsAgent();
    
    const staffList: { 
      fullName: string; 
      position: string; 
      photoUrl: string | null; 
      profileUrl: string | null;
      role: 'CHIEF' | 'TEACHER' 
    }[] = [];

    try {
      const endpoints = [
        { url: 'https://natk.ru/sveden/chief', role: 'CHIEF' as const },
        { url: 'https://natk.ru/sveden/teachers', role: 'TEACHER' as const }
      ];

      for (const endpoint of endpoints) {
        this.logger.log(`➡️ Сканируем список: ${endpoint.url}`);
        const response = await axios.get(endpoint.url, { 
          httpsAgent,
          headers: getStandardHeaders()
        });
        const $ = cheerio.load(response.data);

        $('.teacher-card').each((i, el) => {
          const fullName = $(el).find('.teacher-name').text().trim();
          const position = $(el).find('.teacher-position').text().trim() || 
                          (endpoint.role === 'CHIEF' ? 'Руководитель' : 'Преподаватель');
          
          const imgSrc = $(el).find('.teacher-photo img').attr('src');
          const photoUrl = imgSrc ? `https://natk.ru${imgSrc}` : null;

          // Улучшенный поиск ссылки на профиль
          // 1. Проверяем, не является ли сама карточка ссылкой
          let profileLink = $(el).attr('href');
          
          // 2. Ищем ссылку внутри карточки по специфичным путям
          if (!profileLink) {
            profileLink = $(el).find('a[href*="/chief/"], a[href*="/teachers/"], a[href*="/employees/"]').first().attr('href');
          }
          
          // 3. Если не нашли, ищем вообще любую ссылку внутри
          if (!profileLink) {
            profileLink = $(el).find('a').first().attr('href');
          }

          // 4. Если всё еще нет, проверяем родителя (бывает <a href...><div class="teacher-card">)
          if (!profileLink) {
            profileLink = $(el).closest('a').attr('href');
          }

          // 5. Проверяем атрибуты onclick или data-href
          if (!profileLink) {
            const onclick = $(el).attr('onclick');
            if (onclick && onclick.includes('window.location')) {
              const match = onclick.match(/['"](.*?)['"]/);
              if (match) profileLink = match[1];
            }
          }

          // 6. Поиск по всему документу: ищем ссылку, текст которой совпадает с ФИО
          if (!profileLink && fullName) {
            // Ищем ссылку, которая содержит фамилию (первое слово)
            const lastName = fullName.split(' ')[0];
            // Ищем только в основном контенте, чтобы не поймать меню
            // Пробуем найти ссылку именно с полным именем, а если нет - с фамилией
            profileLink = $(`.item-page a:contains("${fullName}")`).first().attr('href') || 
                          $(`.item-page a:contains("${lastName}")`).first().attr('href') || 
                          $(`a:contains("${fullName}")`).first().attr('href') ||
                          $(`a:contains("${lastName}")`).first().attr('href');
          }

          // 7. Логируем для отладки, если ничего не нашли для первого элемента
          if (i === 0 && !profileLink) {
            const htmlSnippet = $(el).prop('outerHTML');
            this.logger.debug(`Отладка: HTML первой карточки: ${htmlSnippet ? htmlSnippet.substring(0, 300) : 'пусто'}`);
          }

          let profileUrl: string | null = null;
          if (profileLink) {
            if (profileLink.startsWith('http')) {
              profileUrl = profileLink;
            } else if (profileLink.startsWith('/')) {
              profileUrl = `https://natk.ru${profileLink}`;
            } else {
              // Если ссылка относительная (например "3318-..."), 
              // она обычно идет от текущего раздела (/sveden/chief/ или /sveden/teachers/)
              const base = endpoint.url.endsWith('/') ? endpoint.url : `${endpoint.url}/`;
              profileUrl = `${base}${profileLink}`;
            }
          }

          if (fullName) {
            // Защита от дубликатов
            const existing = staffList.find(s => s.fullName === fullName);
            if (!existing) {
              if (profileUrl) {
                this.logger.debug(`Найден URL для ${fullName}: ${profileUrl}`);
              }
              staffList.push({
                fullName,
                position,
                photoUrl,
                profileUrl,
                role: endpoint.role,
              });
            }
          }
        });
      }

      const withUrl = staffList.filter(s => s.profileUrl).length;
      this.logger.log(`✅ Базовый список готов (${staffList.length} чел.). Ссылок на профили найдено: ${withUrl}. Начинаем глубокий парсинг...`);

      // Глубокий парсинг профилей для получения био
      for (const staffData of staffList) {
        let bioHtml: string | null = null;
        let achievements: string[] = [];

        if (staffData.profileUrl) {
          try {
            this.logger.log(`🔍 Парсим профиль: ${staffData.fullName}`);
            const profileResponse = await axios.get(staffData.profileUrl, { 
              httpsAgent,
              headers: getStandardHeaders()
            });
            const p$ = cheerio.load(profileResponse.data);
            
            // 1. Извлекаем биографию/структурированную информацию
            const bioContainer = p$('.item-page, [itemprop="articleBody"]').first();
            
            if (bioContainer.length) {
              // Ищем галерею в любом месте страницы
              const gallery = p$('.sigplus-gallery');
              
              gallery.find('a[href]').each((i, galEl) => {
                const href = p$(galEl).attr('href');
                if (href && (href.toLowerCase().endsWith('.jpg') || href.toLowerCase().endsWith('.png') || href.toLowerCase().endsWith('.jpeg'))) {
                  const fullUrl = href.startsWith('http') ? href : `https://natk.ru${href}`;
                  if (!achievements.includes(fullUrl)) {
                    achievements.push(fullUrl);
                  }
                }
              });

              // Создаем копию контента для очистки
              const cleanContent = cheerio.load(bioContainer.html() || '');
              
              // Удаляем мусор
              cleanContent('.sigplus-gallery, script, style, .print-link, .sharing, .article-info, .page-header, .teacher-schedule-title, .sura_shedule, .last-update, :contains("Расписание занятий"), :contains("Последнее обновление")').remove();
              
              // Пытаемся найти и удалить все после "Расписание занятий" или "Последнее обновление"
              const stopWords = ['Расписание занятий', 'Последнее обновление'];
              cleanContent('h3, h4, p, div').each((i, el) => {
                const text = cleanContent(el).text().trim();
                if (stopWords.some(word => text.includes(word))) {
                  cleanContent(el).nextAll().remove();
                  cleanContent(el).remove();
                }
              });

              // Исправляем ссылки на почту (Joomla Cloak)
              cleanContent('span[id^="cloak"]').each((i, cloak) => {
                const $cloak = cleanContent(cloak);
                const scriptContent = $cloak.next('script').html() || '';
                // Joomla кодирует email в виде массива цифр и складывает их
                // Но мы можем попробовать вытащить его регуляркой, если он там в открытом виде, 
                // или если есть запасной вариант
                const emailMatch = scriptContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                if (emailMatch) {
                  $cloak.replaceWith(`<a href="mailto:${emailMatch[0]}">${emailMatch[0]}</a>`);
                } else {
                  // Если не нашли регуляркой, просто убираем текст про защиту
                  $cloak.replaceWith('<em>[Email скрыт, см. оригинал]</em>');
                }
              });
              cleanContent('script').remove();

              // ПРЕВРАЩАЕМ ОТНОСИТЕЛЬНЫЕ ССЫЛКИ В АБСОЛЮТНЫЕ
              cleanContent('img, a').each((i, el) => {
                const $el = cleanContent(el);
                const attr = el.tagName === 'img' ? 'src' : 'href';
                const val = $el.attr(attr);
                if (val && val.startsWith('/') && !val.startsWith('//')) {
                  $el.attr(attr, `https://natk.ru${val}`);
                }
              });

              bioHtml = cleanContent('body').html()?.trim() || null;
              this.logger.debug(`📄 Профиль ${staffData.fullName}: Био ${bioHtml?.length || 0} симв., Фото достижений: ${achievements.length}`);
            }

            await sleep(SLEEP_DURATION.MEDIUM); // Защита от бана
          } catch (err: any) {
            this.logger.error(`⚠️ Ошибка при парсинге профиля ${staffData.fullName}: ${err.message}`);
          }
        }

        // Сохранение/Обновление в БД
        try {
          let staff = await this.staffRepo.findOne({ 
            where: { fullName: staffData.fullName },
            relations: ['positions']
          });

          if (!staff) {
            staff = this.staffRepo.create({
              fullName: staffData.fullName,
              photoUrl: staffData.photoUrl ?? undefined,
              role: staffData.role,
              profileUrl: staffData.profileUrl ?? undefined,
              bioHtml: bioHtml ?? undefined,
              achievements: achievements.length > 0 ? achievements : undefined
            });
          } else {
            // Обновляем существующего
            staff.photoUrl = staffData.photoUrl ?? staff.photoUrl;
            staff.profileUrl = staffData.profileUrl ?? staff.profileUrl;
            staff.bioHtml = bioHtml ?? staff.bioHtml;
            staff.role = staffData.role;
            staff.achievements = achievements.length > 0 ? achievements : staff.achievements;
          }

          await this.staffRepo.save(staff);

          // Обновляем позицию
          const hasPosition = staff.positions?.some(p => p.positionName === staffData.position);
          if (!hasPosition) {
            const position = this.staffPositionRepo.create({
              positionName: staffData.position,
              staff
            });
            await this.staffPositionRepo.save(position);
          }
        } catch (dbError: any) {
          this.logger.error(`❌ Ошибка БД для ${staffData.fullName}: ${dbError.message}`);
        }
      }

      this.logger.log(`🏁 Глубокая синхронизация сотрудников завершена!`);

    } catch (error: any) {
      this.logger.error(`❌ Ошибка при парсинге сотрудников: ${error.message}`);
    }
  }
  // Запускаем каждую ночь в 4:00
  @Cron('0 4 * * *')
  async parseDocuments() {
    if (!this.runBackgroundParsers) return;
    this.logger.log('📁 Начинаем глубокий сбор документов с пагинацией...');

    const httpsAgent = createHttpsAgent();
    const documentsList: { 
      title: string; 
      fileUrl: string; 
      category: 'GENERAL' | 'PAID_EDU' | 'STANDARDS' | 'GRANTS' | 'ADMISSION' 
    }[] = [];

    const categories = [
      { url: 'https://natk.ru/sveden/document', category: 'GENERAL' as const, paginate: true },
      { url: 'https://natk.ru/sveden/paidedu', category: 'PAID_EDU' as const, paginate: false },
      { url: 'https://natk.ru/sveden/edustandarts', category: 'STANDARDS' as const, paginate: false },
      { url: 'https://natk.ru/sveden/grants', category: 'GRANTS' as const, paginate: false },
      { url: 'https://natk.ru/abitur/doc', category: 'ADMISSION' as const, paginate: false },
    ];

    try {
      for (const catInfo of categories) {
        let offset = 0;
        let hasNextPage = true;
        let totalFoundForCategory = 0;

        while (hasNextPage) {
          // Для основной страницы документов используем docp (т.к. это Joomla с кастомным компонентом)
          // По умолчанию docl=10, поэтому шаг 10, но попробуем 20 как просил пользователь
          const pageUrl = catInfo.paginate 
            ? `${catInfo.url}?docl=20&docp=${offset}` 
            : catInfo.url;
            
          this.logger.log(`➡️ Сканируем: ${pageUrl}`);
          
          const response = await axios.get(pageUrl, { 
            httpsAgent,
            headers: getStandardHeaders()
          });
          const $ = cheerio.load(response.data);
          let foundOnPage = 0;

          // Контейнеры, где могут быть документы
          const containers = $('.WZ4Lc, [itemprop="articleBody"], main, .item-page');
          
          // 1. Сначала ищем в специальных блоках .doc (как на главной странице документов)
          $('.doc').each((i, el) => {
            const $doc = $(el);
            const titleEl = $doc.find('.name');
            const linkEl = $doc.find('a.file, a[href*=".pdf"], a[href*="/docs/"]').first();
            
            const fileUrlRaw = linkEl.attr('href');
            if (!fileUrlRaw) return;

            const fileUrl = fileUrlRaw.startsWith('http') ? fileUrlRaw : `https://natk.ru${fileUrlRaw}`;
            if (documentsList.some(d => d.fileUrl === fileUrl)) return;

            let title = titleEl.text().trim() || linkEl.text().trim();
            if (title.length < 5) {
                title = $doc.text().replace(/скачать/gi, '').trim();
            }

            title = cleanDocTitle(title);

            if (title.length > 5) {
              documentsList.push({ title, fileUrl, category: catInfo.category });
              foundOnPage++;
              totalFoundForCategory++;
            }
          });

          // 2. Затем ищем все остальные ссылки в контейнерах (для страниц типа paidedu)
          containers.find('a').each((i, el) => {
            const $el = $(el);
            const href = $el.attr('href');
            const itemprop = $el.attr('itemprop');
            
            if (!href) return;
            const hrefLower = href.toLowerCase();

            // Проверка на документ
            const isDoc = itemprop === 'documentLink' || 
                          $el.hasClass('file') ||
                          hrefLower.includes('.pdf') || 
                          hrefLower.includes('.doc') || 
                          hrefLower.includes('.xls') || 
                          hrefLower.includes('/docs/') || 
                          hrefLower.includes('/uploads/');

            if (isDoc) {
              // Игнорируем мусор
              if (isJunkLink(hrefLower)) return;

              const fileUrl = href.startsWith('http') ? href : `https://natk.ru${href}`;
              if (documentsList.some(d => d.fileUrl === fileUrl)) return;

              let title = $el.text().trim();
              if (title.length < 5 || /скачать|ссылк|pdf|doc/i.test(title)) {
                title = $el.closest('p, li, td, div').text().trim();
              }

              title = cleanDocTitle(title);

              if (title.length > 5) {
                documentsList.push({ title, fileUrl, category: catInfo.category });
                foundOnPage++;
                totalFoundForCategory++;
              }
            }
          });

          // Логика пагинации
          if (catInfo.paginate) {
            const nextButton = $('.pagination-next a, a:contains("Вперед"), a:contains("Следующая")');
            // Если нашли документы и есть кнопка "Вперед"
            if (foundOnPage > 0 && nextButton.length > 0) {
              offset += 20; // Шаг 20 как просил пользователь
              await sleep(SLEEP_DURATION.LONG);
            } else {
              hasNextPage = false;
            }
          } else {
            hasNextPage = false;
          }
        }
        this.logger.log(`📊 Категория ${catInfo.category}: найдено ${totalFoundForCategory} документов.`);
      }

      this.logger.log(`✅ Сбор завершен! Всего уникальных документов: ${documentsList.length}`);
      
      // Сохранение в БД
      for (const data of documentsList) {
        try {
          let category = await this.docCatRepo.findOne({ where: { name: data.category } });
          if (!category) {
            category = this.docCatRepo.create({ name: data.category });
            await this.docCatRepo.save(category);
          }

          let doc = await this.docRepo.findOne({ where: { fileUrl: data.fileUrl } });
          if (!doc) {
            doc = this.docRepo.create({
              title: data.title,
              fileUrl: data.fileUrl,
              category
            });
            await this.docRepo.save(doc);
          } else if (doc.title !== data.title) {
            doc.title = data.title;
            await this.docRepo.save(doc);
          }
        } catch (err: any) {
          this.logger.error(`❌ Ошибка БД (${data.fileUrl}): ${err.message}`);
        }
      }

    } catch (error: any) {
      this.logger.error(`❌ Ошибка парсинга: ${error.message}`);
    }
  }


  /**
   * Seed a small set of mandatory admission documents so the page is never empty.
   * Uses a placeholder URL pattern (natk.ru/abitur/doc#slug) to avoid fileUrl
   * conflicts with real scraped files. Runs idempotently — skips existing records.
   */
  async seedAdmissionDocuments() {
    this.logger.log('📋 Сидируем обязательные документы для абитуриентов...');

    const mandatory: { title: string; fileUrl: string }[] = [
      {
        title: 'Правила приема 2026',
        fileUrl: 'https://natk.ru/abitur/doc#pravila-priema-2026',
      },
      {
        title: 'Бланк заявления',
        fileUrl: 'https://natk.ru/abitur/doc#blank-zayavleniya',
      },
      {
        title: 'Договор об оказании платных образовательных услуг',
        fileUrl: 'https://natk.ru/abitur/doc#dogovor-platnye-uslugi',
      },
    ];

    try {
      let category = await this.docCatRepo.findOne({ where: { name: 'ADMISSION' } });
      if (!category) {
        category = this.docCatRepo.create({ name: 'ADMISSION' });
        await this.docCatRepo.save(category);
      }

      for (const item of mandatory) {
        const exists = await this.docRepo.findOne({ where: { fileUrl: item.fileUrl } });
        if (!exists) {
          const doc = this.docRepo.create({ title: item.title, fileUrl: item.fileUrl, category });
          await this.docRepo.save(doc);
          this.logger.log(`✅ Добавлен документ-заглушка: ${item.title}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`❌ Ошибка сидирования документов абитуриента: ${err.message}`);
    }
  }

  // Запускаем каждый час, так как расписание часто меняется (отмены пар)
  @Cron('0 * * * *')
  async parseSchedule() {
    if (!this.runBackgroundParsers) return;
    this.logger.log('📅 Начинаем парсинг расписания...');

    const httpsAgent = createHttpsAgent();

    try {
      // 1. Идем на главную страницу расписания, чтобы получить актуальный ID недели (например, 187)
      const mainResponse = await axios.get('https://natk.ru/stud-grad/schedule', { httpsAgent });
      const main$ = cheerio.load(mainResponse.data);

      // Ищем все ссылки на группы
      const groupLinks: { groupName: string; url: string; courseName: string | null }[] =[];
      main$('.group-card').each((i, el) => {
        const url = main$(el).attr('href');
        const groupName = main$(el).text().trim();
        let courseName = main$(el).closest('.course-section').find('.course-title').text().trim() || null;
        
        // Нормализуем название курса или вычисляем из названия группы, если его нет
        if (courseName) {
          courseName = courseName.replace(/курс/i, 'Курс');
        } else {
          const match = groupName.match(/(\d{2})\.\d+/);
          if (match) {
            const admissionYear = parseInt(match[1], 10);
            const currentYear = new Date().getFullYear() % 100; // например, 26 для 2026
            const currentMonth = new Date().getMonth(); // 0-11 (сентябрь = 8)
            
            // Если сейчас до сентября, то учебный год начался в (currentYear - 1)
            const academicYearStart = currentMonth < 8 ? currentYear - 1 : currentYear;
            
            // Вычисляем курс: (текущий учебный год - год поступления) + 1
            // Пример: 2026 (март), учебный год начался в 25. Поступил в 25 -> 25 - 25 + 1 = 1 курс.
            let courseNum = academicYearStart - admissionYear + 1;
            
            // Ограничиваем курс от 1 до 4
            if (courseNum < 1) courseNum = 1;
            if (courseNum > 4) courseNum = 4;
            
            courseName = `${courseNum} Курс`;
          }
        }

        if (url) {
          groupLinks.push({ groupName, url: `https://natk.ru/stud-grad/${url}`, courseName });
        }
      });

      if (groupLinks.length === 0) {
        this.logger.error('❌ Ссылки на группы не найдены!');
        return;
      }

      this.logger.log(`🔍 Найдено групп: ${groupLinks.length}. Начинаем сбор...`);

      // Сначала обновляем курсы у ВСЕХ групп, даже если у части групп нет пар на текущей неделе.
      for (const groupData of groupLinks) {
        try {
          let course: Course | null = null;
          if (groupData.courseName) {
            course = await this.courseRepo.findOne({ where: { name: groupData.courseName } });
            if (!course) {
              course = this.courseRepo.create({ name: groupData.courseName });
              await this.courseRepo.save(course);
            }
          }

          let groupEntity = await this.groupRepo.findOne({
            where: { name: groupData.groupName },
            relations: ['course'],
          });

          if (!groupEntity) {
            groupEntity = this.groupRepo.create({
              name: groupData.groupName,
              course: course || undefined,
            });
            await this.groupRepo.save(groupEntity);
          } else if (!groupEntity.course || (course && groupEntity.course.id !== course.id)) {
            groupEntity.course = course || undefined;
            await this.groupRepo.save(groupEntity);
          }
        } catch (err: any) {
          this.logger.error(`❌ Ошибка при обновлении курса группы ${groupData.groupName}: ${err.message}`);
        }
      }

      const allSchedules: {
        group: string;
        courseName: string | null;
        specialtyCode: string | null;
        date: string;
        dayOfWeek: string;
        lessonNumber: number;
        time: string;
        isSubgroup: boolean;
        subgroupNumber?: number; 
        subject: string;
        teacher: string;
        room: string;
      }[] =[];

      // 2. Идем внутрь каждой группы
      for (const group of groupLinks) {
        this.logger.log(`➡️ Парсим расписание группы: ${group.groupName}`);
        
        const scheduleResponse = await axios.get(group.url, { httpsAgent });
        const $ = cheerio.load(scheduleResponse.data);

        // --- НОВАЯ ЧАСТЬ: Ищем код специальности ---
        // Ищем ссылку, текст которой похож на код (например, 09.02.01) или href содержит /spec-
        let specialtyCode: string | null = null;
        $('a').each((i, el) => {
          const href = $(el).attr('href') || '';
          const text = $(el).text().trim();
          if (href.includes('/spec-') || /^\d{2}\.\d{2}\.\d{2}$/.test(text)) {
            specialtyCode = text;
            return false; // Прерываем цикл each
          }
        });

        if (specialtyCode) {
          this.logger.log(`🎯 Для группы ${group.groupName} найден код специальности: ${specialtyCode}`);
        }

        let currentDate = '';
        let currentDayOfWeek = '';
        let pendingSubgroupInfo: any = null; // Тот самый "Конечный автомат" для запоминания строки

        // Проходимся по каждой строке таблицы расписания
        $('table.sura_shedule tbody tr').each((i, el) => {
          const $tr = $(el);

          // СЦЕНАРИЙ А: Строка с датой (например: "16 марта 2026 г. - Понедельник")
          if ($tr.hasClass('date')) {
            const dateStr = $tr.text().trim();
            const parts = dateStr.split('-');
            if (parts.length === 2) {
              currentDate = parts[0].trim();
              currentDayOfWeek = parts[1].trim();
            }
            return; // Идем к следующей строке
          }

          const $tds = $tr.find('td');
          const rowText = $tr.text().trim().replace(/\s+/g, ' ');

          // СЦЕНАРИЙ Б: дневная запись без номера пары:
          // "не учебный день", "Производственная практика...", "Учебная практика..."
          if (
            currentDate &&
            rowText &&
            $tds.length <= 1 &&
            (
              rowText.toLowerCase().includes('не учебный день') ||
              rowText.toLowerCase().includes('практика')
            )
          ) {
            allSchedules.push({
              group: group.groupName,
              courseName: group.courseName,
              specialtyCode: specialtyCode,
              date: currentDate,
              dayOfWeek: currentDayOfWeek,
              lessonNumber: 0,
              time: '',
              isSubgroup: false,
              subject: rowText,
              teacher: '',
              room: '',
            });
            return;
          }

          // СЦЕНАРИЙ В: Обычная пара для ВСЕЙ группы (3 ячейки)
          if ($tds.length === 3) {
            const lessonNum = $tds.eq(0).text().trim();
            const time = $tds.eq(1).text().trim();
            const spans = $tds.eq(2).find('span'); // Предмет, Препод, Аудитория лежат в span

            allSchedules.push({
              group: group.groupName,
              courseName: group.courseName,
              specialtyCode: specialtyCode,
              date: currentDate,
              dayOfWeek: currentDayOfWeek,
              lessonNumber: parseInt(lessonNum, 10),
              time: time,
              isSubgroup: false, // Пара у всей группы
              subject: spans.eq(0).text().trim(),
              teacher: spans.eq(1).text().trim(),
              room: spans.eq(2).text().trim(),
            });
          }

          // СЦЕНАРИЙ Г: Начало пар с ПОДГРУППАМИ (4 ячейки: номер, время, "1 подгр", "2 подгр")
          else if ($tds.length === 4) {
            // Запоминаем номер пары и время для следующей строки!
            pendingSubgroupInfo = {
              lessonNumber: parseInt($tds.eq(0).text().trim(), 10),
              time: $tds.eq(1).text().trim(),
            };
          }

          // СЦЕНАРИЙ Д: Сами предметы для подгрупп (2 ячейки), опираемся на память из Сценария Г
          else if ($tds.length === 2 && pendingSubgroupInfo) {
            const sub1Spans = $tds.eq(0).find('span');
            const sub2Spans = $tds.eq(1).find('span');

            // Добавляем 1 подгруппу (если предмет есть)
            if (sub1Spans.length > 0) {
              allSchedules.push({
                group: group.groupName,
                courseName: group.courseName,
                specialtyCode: specialtyCode,
                date: currentDate,
                dayOfWeek: currentDayOfWeek,
                lessonNumber: pendingSubgroupInfo.lessonNumber,
                time: pendingSubgroupInfo.time,
                isSubgroup: true,
                subgroupNumber: 1, // <--- Указываем номер подгруппы
                subject: sub1Spans.eq(0).text().trim(),
                teacher: sub1Spans.eq(1).text().trim(),
                room: sub1Spans.eq(2).text().trim(),
              });
            }

            // Добавляем 2 подгруппу (если предмет есть)
            if (sub2Spans.length > 0) {
              allSchedules.push({
                group: group.groupName,
                courseName: group.courseName,
                specialtyCode: specialtyCode,
                date: currentDate,
                dayOfWeek: currentDayOfWeek,
                lessonNumber: pendingSubgroupInfo.lessonNumber,
                time: pendingSubgroupInfo.time,
                isSubgroup: true,
                subgroupNumber: 2, // <--- Указываем номер подгруппы
                subject: sub2Spans.eq(0).text().trim(),
                teacher: sub2Spans.eq(1).text().trim(),
                room: sub2Spans.eq(2).text().trim(),
              });
            }

            // Очищаем память, так как мы обработали обе подгруппы
            pendingSubgroupInfo = null;
          }
        });

        this.logger.log(`⏳ Пауза 1 секунда перед следующей группой...`);
        await sleep(SLEEP_DURATION.SHORT); 
      }

            this.logger.log(`✅ Парсинг расписания успешно завершен! Собрано пар: ${allSchedules.length}`);
      
      // СОХРАНЕНИЕ В БД
      this.logger.log('💾 Сохраняем расписание в базу данных...');

      // Группируем собранные пары по группам
      const schedulesByGroup = new Map<string, typeof allSchedules>();
      for (const group of groupLinks) {
        schedulesByGroup.set(group.groupName, []);
      }
      for (const lesson of allSchedules) {
        schedulesByGroup.get(lesson.group)!.push(lesson);
      }

      // Обрабатываем каждую группу атомарно: удаляем старое + сохраняем новое
      for (const [groupName, groupSchedules] of schedulesByGroup) {
        try {
          // Исключаем дубликаты внутри одной группы
          const uniqueSchedules = groupSchedules.filter((lesson, index, self) =>
            index === self.findIndex((t) => (
              t.date === lesson.date &&
              t.lessonNumber === lesson.lessonNumber &&
              t.subgroupNumber === lesson.subgroupNumber &&
              t.subject === lesson.subject
            ))
          );

          // Находим специальность по коду (берем из первой записи группы)
          let specialty: Specialty | null = null;
          const specialtyCode = uniqueSchedules[0]?.specialtyCode;
          if (specialtyCode) {
            specialty = await this.specialtyRepo.findOne({ where: { code: specialtyCode } });
          }

          // Находим группу (она уже точно есть в БД)
          let group = await this.groupRepo.findOne({ 
            where: { name: groupName },
            relations: ['specialty'] 
          });
          
          if (group && !group.specialty && specialty) {
            group.specialty = specialty;
            await this.groupRepo.save(group);
          }

          if (!group) {
            this.logger.error(`❌ Группа ${groupName} не найдена в БД перед сохранением расписания!`);
            continue; // Пропускаем сохранение расписания, если группа почему-то не нашлась
          }

          // Удаляем ВСЁ старое расписание этой группы перед сохранением нового
          await this.scheduleRepo.delete({ group: { id: group.id } });
          this.logger.debug(`🗑️ Старое расписание для группы ${groupName} удалено (${uniqueSchedules.length} новых пар)`);

          if (uniqueSchedules.length === 0) {
            continue;
          }

          // Сохраняем новые записи
          for (const data of uniqueSchedules) {
            try {
              // Находим или создаем предмет
              let subject = await this.subjectRepo.findOne({ where: { name: data.subject } });
              if (!subject) {
                subject = this.subjectRepo.create({ name: data.subject });
                await this.subjectRepo.save(subject);
              }

              // Находим или создаем аудиторию
              let room: Room | null = null;
              if (data.room) {
                const foundRoom = await this.roomRepo.findOne({ where: { name: data.room } });
                if (!foundRoom) {
                  room = this.roomRepo.create({ name: data.room });
                  await this.roomRepo.save(room);
                } else {
                  room = foundRoom;
                }
              }

              // Находим преподавателя (по ФИО)
              let teacher: Staff | null = null;
              if (data.teacher) {
                teacher = await this.staffRepo.findOne({ where: { fullName: data.teacher } });
              }

              // Конвертируем дату "16 марта 2026 г." в Date
              const lessonDate = parseRussianDate(data.date);

              // Создаем запись расписания
              const newSchedule = this.scheduleRepo.create({
                group,
                subject,
                teacher: teacher || undefined,
                room: room || undefined,
                lessonDate,
                dayOfWeek: data.dayOfWeek,
                lessonNumber: data.lessonNumber,
                startTime: data.time,
                isSubgroup: data.isSubgroup,
                subgroupNumber: data.subgroupNumber
              });
              await this.scheduleRepo.save(newSchedule);
            } catch (dbError: any) {
              this.logger.error(`❌ Ошибка сохранения пары в БД (${data.group}, ${data.date}): ${dbError.message}`);
            }
          }
        } catch (groupError: any) {
          this.logger.error(`❌ Ошибка обработки группы ${groupName}: ${groupError.message}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`❌ Ошибка при парсинге расписания: ${error.message}`);
    }
  }

  async parseStructure() {
    this.logger.log('🕵️ Парсим структуру и органы управления колледжа...');
    const url = 'https://natk.ru/sveden/struct';
    const httpsAgent = createHttpsAgent();

    try {
      const response = await axios.get(url, { 
        httpsAgent,
        headers: getStandardHeaders()
      });
      const $ = cheerio.load(response.data);
      const departments: any[] = [];
      let currentCategory = 'Общая структура';

      // На сайте НАТК структура представлена в виде заголовков h3/h4 и следующих за ними параграфов
      $('.item-page').find('h3, h4').each((i, el) => {
        const $header = $(el);
        const tagName = el.tagName.toLowerCase();
        const id = $header.attr('id');
        const text = $header.text().trim();
        
        // 1. Если это h3 и у него НЕТ id="mark...", то это категория (заголовок раздела)
        if (tagName === 'h3' && (!id || !id.startsWith('mark'))) {
          if (text && text.length > 5) {
            currentCategory = text;
          }
          return;
        }

        // 2. Иначе это подразделение (h3 или h4 с id="mark..." или подходящим текстом)
        if (text && text.length > 3) {
          let headName: string | null = null;
          let address: string | null = null;
          let email: string | null = null;
          let website: string | null = null;
          let documentUrl: string | null = null;

          // Ищем информацию в следующих за заголовком элементах до следующего заголовка
          let $next = $header.next();
          // Ограничиваем поиск 6-ю следующими элементами
          for (let j = 0; j < 6; j++) {
            if (!$next.length || $next.is('h3, h4')) break;

            const nextText = $next.text().trim();
            
            // Поиск руководителя
            if (!headName) {
              const headLink = $next.find('a[href*="/chief/"], a[href*="/teachers/"]').first();
              if (headLink.length) {
                headName = headLink.text().trim();
              } else if (nextText.toLowerCase().includes('директор') || 
                       nextText.toLowerCase().includes('заведующий') || 
                       nextText.toLowerCase().includes('начальник') || 
                       nextText.toLowerCase().includes('руководитель') ||
                       nextText.toLowerCase().includes('председатель') ||
                       nextText.toLowerCase().includes('бухгалтер')) {
                const parts = nextText.split(/\s{2,}|:/);
                headName = parts[parts.length - 1].trim().replace(/\.$/, '');
              }
            }

            // Поиск адреса
            if (nextText.includes('Место нахождения')) {
              address = nextText.replace(/Место нахождения:?/i, '').trim();
            }

            // Поиск email
            if (!email) {
              const emailMatch = nextText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
              if (emailMatch) {
                email = emailMatch[0];
              } else {
                const emailLink = $next.find('a[href^="mailto:"]').attr('href');
                if (emailLink) {
                  email = emailLink.replace('mailto:', '').trim();
                }
              }
            }

            // Поиск ссылки на положение (документ)
            if (!documentUrl) {
              const docLink = $next.find('a[href*=".pdf"], a[href*="/docs/"]').first();
              if (docLink.length) {
                const href = docLink.attr('href');
                documentUrl = href ? (href.startsWith('http') ? href : `https://natk.ru${href}`) : null;
              }
            }

            $next = $next.next();
          }

          departments.push({
            name: text,
            headName: headName || null,
            address: address || null,
            website: website || null,
            email: email || null,
            category: currentCategory,
            documentUrl: documentUrl || null
          });
        }
      });

      // Очистка дубликатов по имени
      const uniqueDepts = departments.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);

      for (const data of uniqueDepts) {
        try {
          let dept: Department | null = await this.departmentRepo.findOne({ where: { name: data.name } });
          if (!dept) {
            dept = this.departmentRepo.create(data as DeepPartial<Department>);
          } else {
            Object.assign(dept, data);
          }
          
          if (dept) {
            await this.departmentRepo.save(dept);
          }
        } catch (err: any) {
          this.logger.error(`Ошибка сохранения подразделения ${data.name}: ${err.message}`);
        }
      }
      this.logger.log(`✅ Структура колледжа спарсена! Найдено подразделений: ${uniqueDepts.length}`);
    } catch (error: any) {
      this.logger.error(`❌ Ошибка при парсинге структуры: ${error.message}`);
    }
  }

  // Запускаем каждый день в 6 утра
  @Cron('0 6 * * *')
  async parseVacancies() {
    if (!this.runBackgroundParsers) return;
    this.logger.log('💼 Начинаем парсинг вакансий...');

    const httpsAgent = createHttpsAgent();
    
    // Строгий тип для наших будущих вакансий
    const vacanciesList: {
      company: string;
      title: string;
      salary: string;
      descriptionHtml: string;
      contacts: string;
    }[] =[];

    try {
      const response = await axios.get('https://natk.ru/stud-grad/vakansii', { httpsAgent });
      const $ = cheerio.load(response.data);

      let currentCompany = 'Неизвестная компания';
      let currentVacancy: any = null;
      let isContactsSection = false;

      // Ищем главный контейнер с текстом и перебираем ВСЕ элементы внутри него по порядку
      $('div[itemprop="blogPost"]').children().each((i, el) => {
        const tagName = el.tagName.toLowerCase();
        const $el = $(el);

        // 1. Нашли <h2> - значит началась новая компания
        if (tagName === 'h2' || $el.find('h2').length > 0) {
          currentCompany = $el.text().trim();
          isContactsSection = false; // Сбрасываем флаг контактов
        } 
        // 2. Нашли <h4> - это либо название вакансии, либо заголовок "Контакты"
        else if (tagName === 'h4') {
          const title = $el.text().trim();
          
          if (title.toLowerCase().includes('контакты')) {
            isContactsSection = true; // Включаем режим сбора контактов
            currentVacancy = null; // Закрываем текущую вакансию
          } else {
            isContactsSection = false;
            // Создаем новую вакансию и добавляем в массив
            currentVacancy = {
              company: currentCompany,
              title: title,
              salary: 'По договоренности',
              descriptionHtml: '',
              contacts: ''
            };
            vacanciesList.push(currentVacancy);
          }
        }
        // 3. Нашли текст (<p>) или списки (<ul>)
        else if (tagName === 'p' || tagName === 'ul') {
          // Если мы сейчас в разделе "Контакты"
          if (isContactsSection) {
            const cleanContacts: string[] = [];
            // Вытаскиваем чистые контакты (игнорируя JS-скрипты, прячущие email)
            $el.find('li').each((_, li) => {
              const emailHref = $(li).find('a[href^="mailto:"]').attr('href');
              if (emailHref) {
                cleanContacts.push(emailHref.replace('mailto:', '').trim()); // Достаем чистый email
              } else {
                cleanContacts.push($(li).text().trim()); // Достаем телефон
              }
            });

            const contactsText = cleanContacts.join('; ');

            // Пробегаемся по массиву и добавляем эти контакты ко всем вакансиям текущей компании
            vacanciesList.forEach(v => {
              if (v.company === currentCompany) {
                v.contacts = contactsText;
              }
            });
          } 
          // Если мы находимся внутри описания конкретной вакансии
          else if (currentVacancy) {
            const text = $el.text().trim();
            
            // Если это первый <p> и там есть слово "руб" - значит это зарплата
            if (tagName === 'p' && !currentVacancy.descriptionHtml && text.includes('руб')) {
              currentVacancy.salary = text;
            } else {
              // Иначе приклеиваем это к описанию вакансии (сохраняя HTML теги)
              // Вырезаем пустые теги, чтобы не было лишних отступов
              const htmlChunk = $.html(el);
              if (!htmlChunk.includes('<p></p>')) {
                currentVacancy.descriptionHtml += htmlChunk;
              }
            }
          }
        }
      });

      this.logger.log(`✅ Парсинг вакансий завершен! Найдено: ${vacanciesList.length} шт.`);
      
      // СОХРАНЕНИЕ В БД
      for (const data of vacanciesList) {
        try {
          // 1. Ищем или создаем компанию
          let company = await this.companyRepo.findOne({ where: { name: data.company } });
          if (!company) {
            company = this.companyRepo.create({
              name: data.company,
              contacts: data.contacts
            });
            await this.companyRepo.save(company);
          } else {
            // Обновляем контакты, если они изменились
            if (company.contacts !== data.contacts) {
              company.contacts = data.contacts;
              await this.companyRepo.save(company);
            }
          }

          // 2. Ищем или создаем вакансию (уникальность по названию внутри компании)
          let vacancy = await this.vacancyRepo.findOne({ 
            where: { 
              title: data.title,
              company: { id: company.id }
            } 
          });

          if (!vacancy) {
            vacancy = this.vacancyRepo.create({
              title: data.title,
              salary: data.salary,
              descriptionHtml: data.descriptionHtml,
              company
            });
            await this.vacancyRepo.save(vacancy);
          }
        } catch (dbError: any) {
          this.logger.error(`❌ Ошибка сохранения вакансии в БД: ${dbError.message}`);
        }
      }

    } catch (error: any) {
      this.logger.error(`❌ Ошибка при парсинге вакансий: ${error.message}`);
    }
  }
}
