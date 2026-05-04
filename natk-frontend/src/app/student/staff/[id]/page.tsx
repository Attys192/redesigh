'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { IStaff, ISchedule } from '@/types';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  Award,
  ChevronRight,
} from 'lucide-react';
import StaffAvatar from '@/components/StaffAvatar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BioSection {
  title: string;
  content: string;
}

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
}

// ─── Section config ───────────────────────────────────────────────────────────

const SECTION_CONFIG: Array<{ match: string; display: string }> = [
  { match: 'Занимаемая должность',           display: 'Занимаемая должность' },
  { match: 'Контактная информация',           display: 'Контактная информация' },
  { match: 'Преподаваемые учебные предметы',  display: 'Преподаваемые дисциплины' },
  { match: 'Уровень профессионального образования', display: 'Образование' },
  { match: 'Сведения о повышении квалификации',     display: 'Повышение квалификации' },
  { match: 'Сведения о профессиональной переподготовке', display: 'Профессиональная переподготовка' },
  { match: 'Сведения о продолжительности опыта работы',  display: 'Опыт работы' },
  { match: 'Ученая степень',                  display: 'Ученая степень' },
  { match: 'Ученое звание',                   display: 'Ученое звание' },
  { match: 'Наименования образовательных программ', display: 'Образовательные программы' },
  { match: 'Сведения о квалификационной категории', display: 'Квалификационная категория' },
];

// ─── transformBio ──────────────────────────────────────────────────────────────

function transformBio(html: string): BioSection[] {
  if (!html) return [];

  // 1. Remove everything starting from "Последнее обновление"
  let clean = html.replace(/Последнее обновление[\s\S]*$/g, '');

  // 2. Remove scripts, iframes, tables, meta, link
  clean = clean
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<table[^>]*>[\s\S]*?<\/table>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '');

  // 3. Decode obfuscated email cloak-spans FIRST (before stripping all spans)
  clean = clean.replace(/<span\s+id="cloak[^"]*"[^>]*>[\s\S]*?<\/span>/gi, (match) => {
    const addyMatch = match.match(/['"]([^'"]*(?:&#\d+;|@)[^'"]*)['"]/);
    if (addyMatch) {
      const decoded = addyMatch[1]
        .replace(/&#109;/g, 'm').replace(/&#97;/g, 'a').replace(/&#105;/g, 'i')
        .replace(/&#108;/g, 'l').replace(/&#116;/g, 't').replace(/&#111;/g, 'o')
        .replace(/&#64;/g, '@').replace(/&#46;/g, '.').replace(/&#101;/g, 'e')
        .replace(/&#100;/g, 'd').replace(/&#117;/g, 'u').replace(/&#114;/g, 'r')
        .replace(/&#99;/g, 'c').replace(/&#98;/g, 'b').replace(/&#102;/g, 'f')
        .replace(/&#103;/g, 'g').replace(/&#104;/g, 'h').replace(/&#106;/g, 'j')
        .replace(/&#107;/g, 'k').replace(/&#110;/g, 'n').replace(/&#112;/g, 'p')
        .replace(/&#113;/g, 'q').replace(/&#115;/g, 's').replace(/&#118;/g, 'v')
        .replace(/&#119;/g, 'w').replace(/&#120;/g, 'x').replace(/&#121;/g, 'y')
        .replace(/&#122;/g, 'z').replace(/&#95;/g, '_').replace(/&#45;/g, '-');
      if (decoded.includes('@')) return decoded;
    }
    return '';
  });

  // 4. Remove noscript blocks (spam-bot protection messages)
  clean = clean.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // 5. Remove all style="..." attributes
  clean = clean.replace(/\s*style="[^"]*"/gi, '');

  // 6. Strip <span> tags but keep text content
  clean = clean.replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '');

  // 7. Remove empty paragraphs / redundant line breaks
  clean = clean
    .replace(/<p[^>]*>\s*(&nbsp;|<br\s*\/?>)?\s*<\/p>/gi, '')
    .replace(/(<br\s*\/?>\s*){2,}/gi, '<br/>')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 8. Split into sections
  const sections: BioSection[] = [];

  for (const cfg of SECTION_CONFIG) {
    const escaped = cfg.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const allMatches = SECTION_CONFIG
      .map((c) => c.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    const patterns = [
      new RegExp(`<h4[^>]*>\\s*${escaped}[\\s\\S]*?<\\/h4>([\\s\\S]*?)(?=<h4|$)`, 'i'),
      new RegExp(`<strong[^>]*>\\s*${escaped}[\\s\\S]*?<\\/strong>([\\s\\S]*?)(?=<strong[^>]*>\\s*(?:${allMatches})|<h4|$)`, 'i'),
      new RegExp(`<b[^>]*>\\s*${escaped}[\\s\\S]*?<\\/b>([\\s\\S]*?)(?=<b[^>]*>|<h4|$)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(clean);
      if (match && match[1] && match[1].trim()) {
        let content = match[1].trim();
        if (cfg.display === 'Контактная информация') {
          content = enrichContactContent(content);
        }
        sections.push({ title: cfg.display, content });
        break;
      }
    }
  }

  return sections;
}

// ─── Contact enrichment ────────────────────────────────────────────────────────

function enrichContactContent(html: string): string {
  // Wrap phone number after "Телефон:"
  let result = html.replace(
    /Телефон:\s*([^<\n]+?)(?=\s*(?:;|<|\n|$))/gi,
    (_, phone) =>
      `<a data-contact="phone" href="tel:${phone.trim().replace(/\s+/g, '')}">${phone.trim()}</a>`
  );

  // Wrap plain-text emails (contain @)
  result = result.replace(
    /(?<!["\\/])([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})(?!["\\/])/g,
    (_, email) => `<a data-contact="email" href="mailto:${email}">${email}</a>`
  );

  // Remove spam-bot placeholder text
  result = result.replace(/Адрес электронной почты защищен[^<.]*/gi, '');

  return result;
}

// ─── Build plain-text address from contact section ────────────────────────────

function extractAddressFromContent(enrichedHtml: string): string {
  // Strip all HTML tags, then extract "Место нахождения: …" up to ";"
  const plain = enrichedHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.match(/Место нахождения:\s*([^;]+)/i)?.[1]?.trim() ?? '';
}

// ─── extractContactInfo (for left sidebar) ────────────────────────────────────

const extractContactInfo = (bioHtml: string): ContactInfo => {
  const plain = bioHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  return {
    phone:   plain.match(/Телефон:\s*([^;\n<]+)/i)?.[1]?.trim() ?? '',
    email:   plain.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/)?.[1]?.trim() ?? '',
    address: plain.match(/Место нахождения:\s*([^;]+)/i)?.[1]?.trim() ?? '',
  };
};

// ─── extractDisciplines ────────────────────────────────────────────────────────

// ─── Day of week abbreviation ───────────────────────────────────────────────────

const DAY_ABBR: Record<string, string> = {
  'Понедельник': 'Пн',
  'Вторник':     'Вт',
  'Среда':       'Ср',
  'Четверг':     'Чт',
  'Пятница':     'Пт',
  'Суббота':     'Сб',
  'Воскресенье': 'Вс',
};

function getDayAbbr(day: string): string {
  // Try exact match first, then case-insensitive prefix match
  if (DAY_ABBR[day]) return DAY_ABBR[day];
  const key = Object.keys(DAY_ABBR).find(
    (k) => day.toLowerCase().startsWith(k.toLowerCase())
  );
  return key ? DAY_ABBR[key] : day.substring(0, 2);
}

function formatScheduleDay(lesson: ISchedule): string {
  const formattedDate = new Date(lesson.lessonDate).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
  });

  return `${lesson.dayOfWeek}, ${formattedDate}`;
}

// ─── Page component ────────────────────────────────────────────────────────────

export default function StaffProfilePage() {
  const params = useParams();
  const id = params.id;

  const [staff, setStaff] = useState<IStaff | null>(null);
  const [schedule, setSchedule] = useState<ISchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        const staffRes = await fetch(`/api/staff/${id}`);
        if (!staffRes.ok) throw new Error('Not found');
        const staffData: IStaff = await staffRes.json();
        setStaff(staffData);

        const lastName = staffData.fullName.split(' ')[0];
        const scheduleRes = await fetch(
          `/api/schedule?teacher=${encodeURIComponent(lastName)}`
        );
        if (scheduleRes.ok) {
          const scheduleData: ISchedule[] = await scheduleRes.json();
          setSchedule(scheduleData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaffData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Сотрудник не найден</h2>
          <Link
            href="/student/staff"
            className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 font-medium transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
            Вернуться к списку преподавателей
          </Link>
        </div>
      </div>
    );
  }

  const contactInfo = staff.bioHtml ? extractContactInfo(staff.bioHtml) : { phone: '', email: '', address: '' };
  const bioSections = staff.bioHtml ? transformBio(staff.bioHtml) : [];
  const achievementImages = (staff.achievements ?? []).filter((url) => {
    const normalizedUrl = url.trim();
    return (
      normalizedUrl &&
      normalizedUrl !== staff.photoUrl &&
      !normalizedUrl.includes('/teachers/full/') &&
      /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(normalizedUrl)
    );
  });
  const scheduleByDay = schedule.reduce<Record<string, ISchedule[]>>((acc, lesson) => {
    const dayTitle = formatScheduleDay(lesson);
    if (!acc[dayTitle]) acc[dayTitle] = [];
    acc[dayTitle].push(lesson);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back button */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <Link
          href="/student/staff"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-700 font-medium transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
          Назад к преподавателям
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Left column ── */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              {/* Photo */}
              <div className="relative mb-6">
                <StaffAvatar
                  name={staff.fullName}
                  src={staff.photoUrl}
                  className="aspect-square rounded-2xl"
                />
                {staff.role === 'CHIEF' && (
                  <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    Руководство
                  </div>
                )}
              </div>

              {/* Name & positions */}
              <h1 className="text-xl font-bold text-slate-900 mb-3 leading-tight">
                {staff.fullName}
              </h1>
              <div className="flex flex-wrap gap-2 mb-6">
                {staff.positions.map((pos) => (
                  <span
                    key={pos.id}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium"
                  >
                    {pos.positionName}
                  </span>
                ))}
              </div>

              {/* Contacts */}
              {(contactInfo.phone || contactInfo.email || contactInfo.address) && (
                <div className="border-t border-slate-200 pt-5 space-y-3">
                  {contactInfo.phone && (
                    <a
                      href={`tel:${contactInfo.phone.replace(/\s+/g, '')}`}
                      className="flex items-center gap-3 text-slate-700 hover:text-blue-700 transition-colors"
                    >
                      <Phone size={16} className="text-blue-600 shrink-0" />
                      <span className="text-sm">{contactInfo.phone}</span>
                    </a>
                  )}
                  {contactInfo.email && (
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="flex items-center gap-3 text-slate-700 hover:text-blue-700 transition-colors"
                    >
                      <Mail size={16} className="text-blue-600 shrink-0" />
                      <span className="text-sm break-all">{contactInfo.email}</span>
                    </a>
                  )}
                  {contactInfo.address && (
                    <div className="flex items-start gap-3 text-slate-700">
                      <MapPin size={16} className="text-blue-600 mt-0.5 shrink-0" />
                      <span className="text-sm leading-relaxed">{contactInfo.address}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Link to original profile */}
              {staff.profileUrl && (
                <div className="border-t border-slate-200 pt-5 mt-5">
                  <a
                    href={staff.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <BookOpen size={18} />
                    Оригинал на сайте
                  </a>
                </div>
              )}
            </div>
          </aside>

          {/* ── Right column ── */}
          <main className="lg:col-span-9 space-y-6">

            {/* Bio section cards */}
            {bioSections.length > 0 ? (
              bioSections.map((section, index) => (
                <BioCard key={index} section={section} />
              ))
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
                <span className="text-4xl mb-4 block opacity-40">📝</span>
                <p className="text-slate-500">Информация отсутствует</p>
              </div>
            )}

            {/* Achievements */}
            {achievementImages.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                  <Award size={20} />
                  Достижения
                </h2>
                <div className="h-px bg-slate-200 mb-4" />
                <div className="flex gap-4 overflow-x-auto pb-3">
                  {achievementImages.map((imgUrl, idx) => (
                    <a
                      key={idx}
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-[3/4] w-44 shrink-0 overflow-hidden rounded-xl border-2 border-slate-200 transition-all hover:border-blue-600"
                    >
                      <img
                        src={imgUrl}
                        alt={`Достижение ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium">
                        Увеличить
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Актуальное расписание
              </h2>
              <div className="h-px bg-slate-200 mb-4" />
{schedule.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(scheduleByDay).map(([dayTitle, lessons]) => (
                    <div key={dayTitle} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-black uppercase tracking-wider text-slate-800">
                          {dayTitle}
                        </h3>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>

                      {lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="grid grid-cols-[64px_150px_minmax(0,1fr)] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all hover:border-blue-300 hover:bg-blue-50"
                        >
                          <div className="flex flex-col items-center justify-center border-r border-slate-200 p-4">
                            <span className="text-blue-600 font-black text-lg leading-none">{lesson.lessonNumber}</span>
                            <span className="mt-1 text-[10px] font-bold uppercase text-slate-400">пара</span>
                          </div>
                          <div className="flex items-center justify-center border-r border-slate-200 px-4 py-4 text-center">
                            <span className="whitespace-nowrap text-sm font-bold text-slate-600">
                              {lesson.startTime || '--:--'}
                            </span>
                          </div>
                          <div className="min-w-0 space-y-1 p-4">
                            <p className="font-semibold leading-snug text-slate-900">{lesson.subject.name}</p>
                            <p className="text-sm font-medium text-slate-500">{lesson.group.name}</p>
                            {lesson.room?.name && (
                              <p className="text-sm font-medium text-slate-500">Ауд. {lesson.room.name}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                  <Calendar size={44} className="mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-600 font-medium">Занятий не найдено</p>
                  <p className="text-slate-500 text-sm mt-1">Расписание временно недоступно</p>
                </div>
              )}
            </div>

          </main>
        </div>
      </div>

      <style jsx>{`
        .bio-content,
        .bio-content * {
          color: #0f172a !important;
          background-color: transparent !important;
          font-family: inherit !important;
        }
        .bio-content ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 0.75rem 0 !important;
        }
        .bio-content ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 0.75rem 0 !important;
        }
        .bio-content li {
          margin-bottom: 0.4rem !important;
        }
        .bio-content p {
          margin-bottom: 0.75rem !important;
          line-height: 1.65 !important;
        }
        .bio-content strong {
          font-weight: 600 !important;
        }
      `}</style>
    </div>
  );
}

// ─── BioCard component ─────────────────────────────────────────────────────────

function BioCard({ section }: { section: BioSection }) {
  const isContact = section.title === 'Контактная информация';

  if (isContact) {
    // Extract structured data from the enriched HTML
    const phoneMatch  = section.content.match(/data-contact="phone"\s+href="([^"]+)"[^>]*>([^<]+)</);
    const emailMatch  = section.content.match(/data-contact="email"\s+href="([^"]+)"[^>]*>([^<]+)</);
    const address     = extractAddressFromContent(section.content);

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-blue-700 mb-4">Контактная информация</h3>
        <div className="h-px bg-slate-100 mb-4" />
        <div className="flex flex-wrap gap-3 mb-3">
          {phoneMatch && (
            <a
              href={phoneMatch[1]}
              className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <Phone size={16} />
              {phoneMatch[2]}
            </a>
          )}
          {emailMatch && (
            <a
              href={emailMatch[1]}
              className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <Mail size={16} />
              {emailMatch[2]}
            </a>
          )}
        </div>
        {address && (
          <div className="flex items-start gap-2 text-slate-700 text-sm mt-2">
            <MapPin size={15} className="text-blue-600 mt-0.5 shrink-0" />
            <span className="leading-relaxed">{address}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-xl font-bold text-blue-700 mb-4">{section.title}</h3>
      <div className="h-px bg-slate-100 mb-4" />
      <div
        className="bio-content leading-relaxed text-slate-900"
        dangerouslySetInnerHTML={{ __html: section.content }}
      />
    </div>
  );
}
