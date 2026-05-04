import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, ILike, Repository } from 'typeorm';
import { News } from '../entities/news.entity';
import { Staff } from '../entities/staff.entity';
import { Document } from '../entities/document.entity';
import { Vacancy } from '../entities/vacancy.entity';
import { Schedule } from '../entities/schedule.entity';
import { Specialty } from '../entities/specialty.entity';
import { Campus } from '../entities/campus.entity';
import { Group } from '../entities/group.entity';
import { Department } from '../entities/department.entity';

@Injectable()
export class ApiService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(News) private newsRepo: Repository<News>,
    @InjectRepository(Staff) private staffRepo: Repository<Staff>,
    @InjectRepository(Document) private docRepo: Repository<Document>,
    @InjectRepository(Vacancy) private vacancyRepo: Repository<Vacancy>,
    @InjectRepository(Schedule) private scheduleRepo: Repository<Schedule>,
    @InjectRepository(Specialty) private specialtyRepo: Repository<Specialty>,
    @InjectRepository(Campus) private campusRepo: Repository<Campus>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(Department) private departmentRepo: Repository<Department>,
  ) {}

  findAllNews() {
    return this.newsRepo.find({ relations: ['images'], order: { publishedDate: 'DESC' } });
  }

  findAllStaff() {
    return this.staffRepo.find({ relations: ['positions'] });
  }

  async findOneStaff(id: number) {
    const staff = await this.staffRepo.findOne({ 
      where: { id },
      relations: ['positions'] 
    });
    if (!staff) throw new NotFoundException(`Сотрудник с ID ${id} не найден`);
    return staff;
  }

  async findStaffByName(name: string) {
    // Берем первую часть (фамилию) для поиска
    const lastName = name.split(' ')[0];
    return this.staffRepo.find({
      where: { fullName: ILike(`${lastName}%`) },
      relations: ['positions']
    });
  }

  findAllDocuments(category?: string) {
    if (category) {
      return this.docRepo.find({
        where: { category: { name: category.toUpperCase() } },
        relations: ['category'],
        order: { id: 'ASC' },
      });
    }
    return this.docRepo.find({ relations: ['category'], order: { id: 'ASC' } });
  }

  findAdmissionDocuments() {
    return this.docRepo.find({ 
      where: { category: { name: 'ADMISSION' } },
      relations: ['category'] 
    });
  }

  findAllVacancies() {
    return this.vacancyRepo.find({ relations: ['company'] });
  }

  private async getLatestScheduleWeekRange(): Promise<{ start: Date; end: Date } | null> {
    const latest = await this.scheduleRepo
      .createQueryBuilder('schedule')
      .select('MAX(schedule.lessonDate)', 'max')
      .getRawOne<{ max: string | Date | null }>();

    if (!latest?.max) return null;

    const latestDate = new Date(latest.max);
    const start = new Date(latestDate);
    start.setDate(latestDate.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const end = new Date(latestDate);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  async findAllSchedule(groupName?: string, teacherName?: string) {
    const weekRange = await this.getLatestScheduleWeekRange();
    const where: any = {};
    if (groupName) {
      where.group = { name: groupName };
    }
    if (teacherName) {
      // Поиск по ФИО преподавателя в расписании (через ILIKE)
      where.teacher = { fullName: ILike(`%${teacherName}%`) };
    }
    if (weekRange) {
      where.lessonDate = Between(weekRange.start, weekRange.end);
    }
    
    return this.scheduleRepo.find({
      where,
      relations: ['group', 'subject', 'teacher', 'room'],
      order: { lessonDate: 'ASC', lessonNumber: 'ASC' },
    });
  }

  async findUniqueGroups() {
    const groups = await this.groupRepo.find({
      order: { name: 'ASC' },
    });
    return groups.map((g) => g.name);
  }

  findAllSpecialties() {
    return this.specialtyRepo.find({ relations: ['campus', 'groups'] });
  }

  async findSpecialtyProfiles() {
    await this.ensureSpecialtyProfilesTable();

    return this.dataSource.query(
      `SELECT
         sp.id,
         sp.specialty_id AS "specialtyId",
         s.code,
         s.title,
         sp.source_url AS "sourceUrl",
         sp.description,
         sp.full_text AS "fullText",
         sp.content_html AS "contentHtml",
         sp.disciplines,
         sp.professional_areas AS "professionalAreas",
         sp.skills,
         sp.career_options AS "careerOptions",
         sp.content_hash AS "contentHash",
         sp.source_updated_at AS "sourceUpdatedAt",
         sp.last_parsed_at AS "lastParsedAt",
         sp.last_checked_at AS "lastCheckedAt"
       FROM specialty_profiles sp
       JOIN specialties_v2 s ON s.id = sp.specialty_id
       ORDER BY s.code`,
    );
  }

  async findSpecialtyProfile(code: string) {
    await this.ensureSpecialtyProfilesTable();

    const rows = await this.dataSource.query(
      `SELECT
         sp.id,
         sp.specialty_id AS "specialtyId",
         s.code,
         s.title,
         sp.source_url AS "sourceUrl",
         sp.description,
         sp.full_text AS "fullText",
         sp.content_html AS "contentHtml",
         sp.disciplines,
         sp.professional_areas AS "professionalAreas",
         sp.skills,
         sp.career_options AS "careerOptions",
         sp.content_hash AS "contentHash",
         sp.source_updated_at AS "sourceUpdatedAt",
         sp.last_parsed_at AS "lastParsedAt",
         sp.last_checked_at AS "lastCheckedAt"
       FROM specialty_profiles sp
       JOIN specialties_v2 s ON s.id = sp.specialty_id
       WHERE s.code = $1
       LIMIT 1`,
      [code],
    );

    if (!rows[0]) throw new NotFoundException(`Профиль специальности ${code} не найден`);
    return rows[0];
  }

  private ensureSpecialtyProfilesTable() {
    return this.dataSource.query(
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

  findAdmissionCampaigns() {
    return this.dataSource.query(
      `SELECT
         c.id,
         c.year,
         c.name,
         COUNT(p.id)::int AS "plansCount",
         COALESCE(SUM(p.places), 0)::int AS places
       FROM admission_campaigns c
       LEFT JOIN admission_plans p ON p.campaign_id = c.id
       GROUP BY c.id, c.year, c.name
       ORDER BY
         CASE WHEN COUNT(p.id) > 0 THEN 0 ELSE 1 END,
         c.year DESC`,
    );
  }

  async findAdmissionPlans(year?: number) {
    const params: unknown[] = [];
    const yearFilter = year ? 'WHERE c.year = $1' : '';
    if (year) params.push(year);

    return this.dataSource.query(
      `SELECT
         p.id,
         c.id AS "campaignId",
         c.year AS "campaignYear",
         c.name AS "campaignName",
         s.id AS "specialtyId",
         s.code AS "specialtyCode",
         s.title AS "specialtyTitle",
         campus.id AS "campusId",
         campus.address AS "campusAddress",
         eb.code AS "educationBase",
         ft.code AS "fundingType",
         ef.code AS "formType",
         p.duration_months AS "durationMonths",
         p.places
       FROM admission_plans p
       JOIN admission_campaigns c ON c.id = p.campaign_id
       JOIN specialties_v2 s ON s.id = p.specialty_id
       LEFT JOIN campuses campus ON campus.id = p.campus_id
       JOIN education_bases eb ON eb.id = p.education_base_id
       JOIN funding_types ft ON ft.id = p.funding_type_id
       JOIN education_forms ef ON ef.id = p.form_id
       ${yearFilter}
       ORDER BY c.year DESC, ef.id, eb.id, ft.id, s.code, p.duration_months`,
      params,
    );
  }

  async findAdmissionResults(year?: number) {
    const params: unknown[] = [];
    const yearFilter = year ? 'WHERE c.year = $1' : '';
    if (year) params.push(year);

    return this.dataSource.query(
      `SELECT DISTINCT ON (p.id) -- Гарантирует уникальность планов в списке
         p.id AS "planId",
         c.id AS "campaignId",
         c.year AS "campaignYear",
         c.name AS "campaignName",
         s.id AS "specialtyId",
         s.code AS "specialtyCode",
         s.title AS "specialtyTitle",
         campus.address AS "campusAddress",
         eb.code AS "educationBase",
         ft.code AS "fundingType",
         ef.code AS "formType",
         p.duration_months AS "durationMonths",
         p.places,
         r.id AS "resultId",
         r.applications_count AS "applicationsCount",
         r.competition,
         r.avg_score AS "avgScore",
         r.passing_score AS "passingScore",
         r.accepted,
         r.updated_at AS "updatedAt"
       FROM admission_plans p
       JOIN admission_campaigns c ON c.id = p.campaign_id
       JOIN specialties_v2 s ON s.id = p.specialty_id
       LEFT JOIN campuses campus ON campus.id = p.campus_id
       JOIN education_bases eb ON eb.id = p.education_base_id
       JOIN funding_types ft ON ft.id = p.funding_type_id
       JOIN education_forms ef ON ef.id = p.form_id
       LEFT JOIN admission_results r ON r.plan_id = p.id
       ${yearFilter}
       ORDER BY p.id, r.updated_at DESC -- Берем самый свежий результат для каждого плана`,
      params,
    );
  }

  findAllCampuses() {
    return this.campusRepo.find({ relations: ['specialties'] });
  }

  findAllGroups() {
    return this.groupRepo.find({
      relations: ['specialty', 'course'],
      order: { name: 'ASC' },
    });
  }

  findAllDepartments() {
    return this.departmentRepo.find();
  }
}
