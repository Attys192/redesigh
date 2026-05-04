/**
 * Shared TypeScript Types for NATK Project
 * Used across Backend, Frontend, and Mobile applications
 */

// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = 'applicant' | 'student' | 'teacher';

export type StaffRole = 'CHIEF' | 'TEACHER';

export type DocumentCategoryType = 'GENERAL' | 'PAID_EDU' | 'STANDARDS' | 'GRANTS' | 'ADMISSION';

// ============================================================================
// BASE INTERFACES (Common fields)
// ============================================================================

export interface IBaseEntity {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// NEWS
// ============================================================================

export interface INewsImage {
  id: number;
  imageUrl: string;
  newsId?: number;
}

export interface INews {
  id: number;
  title: string;
  url: string;
  publishedDate: string; // ISO string format for consistency
  contentHtml?: string;
  mainImageUrl?: string;
  images: INewsImage[];
}

// ============================================================================
// STAFF
// ============================================================================

export interface IStaffPosition {
  id: number;
  positionName: string;
}

export interface IStaff {
  id: number;
  fullName: string;
  photoUrl?: string;
  profileUrl?: string;
  bioHtml?: string;
  achievements?: string[];
  role: StaffRole;
  positions: IStaffPosition[];
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export interface IDocumentCategory {
  id: number;
  name: DocumentCategoryType;
}

export interface IDocument {
  id: number;
  title: string;
  fileUrl: string;
  category: IDocumentCategory;
}

// ============================================================================
// CAREER (VACANCIES & COMPANIES)
// ============================================================================

export interface ICompany {
  id: number;
  name: string;
  contacts?: string;
}

export interface IVacancy {
  id: number;
  company: ICompany;
  title: string;
  salary?: string;
  descriptionHtml?: string;
}

// ============================================================================
// EDUCATION (CAMPUSES, SPECIALTIES, GROUPS)
// ============================================================================

export interface ICampus {
  id: number;
  address: string;
}

export interface ICourse {
  id: number;
  name: string;
}

export interface ISpecialty {
  id: string;
  code: string;
  title: string;
  campus: ICampus | string; // ICampus for backend, string (address) for frontend
  passingScore?: number;
  budgetPlaces?: number;
}

export interface IGroup {
  id: number;
  name: string;
  course?: ICourse;
  specialty?: ISpecialty;
}

// ============================================================================
// SCHEDULE
// ============================================================================

export interface ISubject {
  id: number;
  name: string;
}

export interface IRoom {
  id: number;
  name: string;
}

export interface ISchedule {
  id: number;
  group: IGroup;
  subject: ISubject;
  teacher?: IStaff;
  room?: IRoom;
  lessonDate: string; // ISO string format
  dayOfWeek: string;
  lessonNumber: number;
  startTime?: string;
  isSubgroup: boolean;
  subgroupNumber?: number;
}

// Simplified schedule item for display purposes
export interface IScheduleDisplay {
  lessonNumber: number;
  startTime?: string;
  dayOfWeek: string;
  lessonDate: string;
  subject: string;
  teacher?: string;
  room?: string;
  isSubgroup: boolean;
  subgroupNumber?: number;
}

// ============================================================================
// STRUCTURE
// ============================================================================

export interface IDepartment {
  id: number;
  name: string;
  headName?: string;
  address?: string;
  website?: string;
  email?: string;
  category?: string;
  documentUrl?: string;
}

// ============================================================================
// ADMISSION
// ============================================================================

export interface IAdmissionStatus {
  registrationCode: string;
  specialtyCode: string;
  score: number;
  hasOriginal: boolean;
  yourPosition: number;
  totalApplicants: number;
  budgetPlaces: number;
  isPassing: boolean;
}

export interface IAdmissionCampaign {
  id: number;
  year: number;
  name: string;
  plansCount?: number;
  places?: number;
}

export interface IAdmissionPlan {
  id: number;
  campaignId: number;
  campaignYear: number;
  campaignName: string;
  specialtyId: number;
  specialtyCode: string;
  specialtyTitle: string;
  campusId?: number | null;
  campusAddress?: string | null;
  educationBase: '9' | '11' | number;
  fundingType: 'budget' | 'paid' | string;
  formType: 'full-time' | 'part-time' | string;
  durationMonths: number;
  places: number;
}

export interface IAdmissionResult extends IAdmissionPlan {
  planId: number;
  resultId?: number | null;
  applicationsCount?: number | null;
  competition?: number | null;
  avgScore?: number | null;
  passingScore?: number | null;
  accepted?: number | null;
  updatedAt?: string | null;
}

export interface ISpecialtyProfile {
  id: number;
  specialtyId: number;
  code: string;
  title: string;
  sourceUrl: string;
  description?: string | null;
  fullText: string;
  contentHtml?: string | null;
  disciplines: string[];
  professionalAreas: string[];
  skills: string[];
  careerOptions: string[];
  contentHash: string;
  sourceUpdatedAt?: string | null;
  lastParsedAt: string;
  lastCheckedAt: string;
}

// ============================================================================
// CALCULATOR
// ============================================================================

export interface ISubjectArea {
  id: string;
  title: string;
  subjects: string[];
}

export interface IGradeInput {
  [subjectName: string]: number | null;
}

// ============================================================================
// TEST (PROFORIENTATION)
// ============================================================================

export interface ITestAnswer {
  text: string;
  iconName: string; // Icon name from Lucide
  nextQuestionId?: number;
  resultCode?: string;
}

export interface ITestQuestion {
  id: number;
  text: string;
  answers: ITestAnswer[];
}

export interface ISpecialtyInfo {
  code: string;
  title: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface IApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ISyncStatus {
  isParsing: boolean;
}

export interface ISyncResult {
  status: 'started' | 'already_running';
  message: string;
}

// ============================================================================
// GROUPED LESSON (For Schedule Display)
// ============================================================================

export interface ISubgroupInfo {
  subject: string;
  teacher?: string;
  room?: string;
}

export interface IGroupedLesson {
  lessonNumber: number;
  startTime?: string;
  dayOfWeek: string;
  lessonDate: string;
  wholeGroup?: ISubgroupInfo;
  subgroups?: {
    1?: ISubgroupInfo;
    2?: ISubgroupInfo;
  };
  isSubgroup: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
