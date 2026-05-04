-- SQL-скрипт создания базы данных для проекта редизайна сайта колледжа (NATK)
-- Спроектировано в 3-й нормальной форме (3NF) для PostgreSQL

-- 1. Справочник корпусов (устраняем избыточность адресов)
CREATE TABLE campuses (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL UNIQUE
);

-- 2. Справочник специальностей
CREATE TABLE specialties (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    campus_id INTEGER REFERENCES campuses(id) ON DELETE SET NULL
);

-- 3. Справочник учебных групп
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    specialty_id INTEGER REFERENCES specialties(id) ON DELETE SET NULL
);

-- 4. Справочник сотрудников (преподаватели и руководство)
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    role VARCHAR(20) CHECK (role IN ('CHIEF', 'TEACHER')) NOT NULL
);

-- 5. Должности сотрудников (связь 1:N или M:N, вынесено для 3NF)
CREATE TABLE staff_positions (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    position_name VARCHAR(255) NOT NULL
);

-- 6. Новости
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    url TEXT NOT NULL UNIQUE,
    published_date DATE,
    content_html TEXT,
    main_image_url TEXT
);

-- 7. Дополнительные изображения новостей (1:N к новостям)
CREATE TABLE news_images (
    id SERIAL PRIMARY KEY,
    news_id INTEGER NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
);

-- 8. Категории документов
CREATE TABLE document_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE -- GENERAL, PAID_EDU, STANDARDS, GRANTS
);

-- 9. Документы
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL UNIQUE,
    category_id INTEGER NOT NULL REFERENCES document_categories(id)
);

-- 10. Справочник предметов (устраняем повторение названий в расписании)
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- 11. Справочник аудиторий
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 12. Расписание (Связующая таблица для всех сущностей)
CREATE TABLE schedule (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    teacher_id INTEGER REFERENCES staff(id), -- может быть пусто, если не указан
    room_id INTEGER REFERENCES rooms(id),
    lesson_date DATE NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    lesson_number INTEGER NOT NULL,
    start_time VARCHAR(20),
    is_subgroup BOOLEAN DEFAULT FALSE,
    subgroup_number INTEGER -- 1 или 2
);

-- 13. Компании (Работодатели)
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    contacts TEXT
);

-- 14. Вакансии (1:N к компаниям)
CREATE TABLE vacancies (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    salary VARCHAR(100),
    description_html TEXT
);

-- Индексы для ускорения поиска
CREATE INDEX idx_schedule_date ON schedule(lesson_date);
CREATE INDEX idx_schedule_group ON schedule(group_id);
CREATE INDEX idx_news_date ON news(published_date);
CREATE INDEX idx_staff_name ON staff(full_name);
