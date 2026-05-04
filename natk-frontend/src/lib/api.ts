/**
 * Centralized API Client for Frontend
 * All API calls go through this client
 */

import {
  INews,
  IStaff,
  IDocument,
  IVacancy,
  ISchedule,
  ISpecialty,
  ICampus,
  IGroup,
  IDepartment,
  IAdmissionStatus,
  IAdmissionCampaign,
  IAdmissionPlan,
  IAdmissionResult,
  ISpecialtyProfile,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3005';

// Default fetch options
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Generic fetch wrapper with error handling
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// ============================================================================
// News API
// ============================================================================

export async function getNews(): Promise<INews[]> {
  return fetchApi<INews[]>('/api/news');
}

// ============================================================================
// Staff API
// ============================================================================

export async function getStaff(): Promise<IStaff[]> {
  return fetchApi<IStaff[]>('/api/staff');
}

export async function getStaffById(id: number): Promise<IStaff> {
  return fetchApi<IStaff>(`/api/staff/${id}`);
}

export async function searchStaff(name: string): Promise<IStaff[]> {
  return fetchApi<IStaff[]>(`/api/staff/find?name=${encodeURIComponent(name)}`);
}

// ============================================================================
// Documents API
// ============================================================================

export async function getDocuments(category?: string): Promise<IDocument[]> {
  const endpoint = category 
    ? `/api/documents?category=${encodeURIComponent(category)}`
    : '/api/documents';
  return fetchApi<IDocument[]>(endpoint);
}

export async function getAdmissionDocuments(): Promise<IDocument[]> {
  return fetchApi<IDocument[]>('/api/documents/admission');
}

// ============================================================================
// Vacancies API
// ============================================================================

export async function getVacancies(): Promise<IVacancy[]> {
  return fetchApi<IVacancy[]>('/api/vacancies');
}

// ============================================================================
// Schedule API
// ============================================================================

export async function getGroups(): Promise<string[]> {
  return fetchApi<string[]>('/api/schedule/groups');
}

export async function getSchedule(group: string): Promise<ISchedule[]> {
  return fetchApi<ISchedule[]>(`/api/schedule?group=${encodeURIComponent(group)}`);
}

export async function getScheduleByTeacher(teacher: string): Promise<ISchedule[]> {
  return fetchApi<ISchedule[]>(`/api/schedule?teacher=${encodeURIComponent(teacher)}`);
}

// ============================================================================
// Specialties API
// ============================================================================

export async function getSpecialties(): Promise<ISpecialty[]> {
  return fetchApi<ISpecialty[]>('/api/specialties');
}

export async function getSpecialtyProfiles(): Promise<ISpecialtyProfile[]> {
  return fetchApi<ISpecialtyProfile[]>('/api/specialty-profiles');
}

export async function getSpecialtyProfile(code: string): Promise<ISpecialtyProfile> {
  return fetchApi<ISpecialtyProfile>(`/api/specialty-profiles/${encodeURIComponent(code)}`);
}

// ============================================================================
// Campuses API
// ============================================================================

export async function getCampuses(): Promise<ICampus[]> {
  return fetchApi<ICampus[]>('/api/campuses');
}

// ============================================================================
// Groups API
// ============================================================================

export async function getAllGroups(): Promise<IGroup[]> {
  return fetchApi<IGroup[]>('/api/groups');
}

// ============================================================================
// Departments API
// ============================================================================

export async function getDepartments(): Promise<IDepartment[]> {
  return fetchApi<IDepartment[]>('/api/departments');
}

// ============================================================================
// Admission API
// ============================================================================

export async function getAdmissionStatus(code: string): Promise<IAdmissionStatus> {
  return fetchApi<IAdmissionStatus>(`/api/admission/status/${encodeURIComponent(code)}`);
}

export async function getAdmissionCampaigns(): Promise<IAdmissionCampaign[]> {
  return fetchApi<IAdmissionCampaign[]>('/api/admission/campaigns');
}

export async function getAdmissionPlans(year?: number): Promise<IAdmissionPlan[]> {
  const endpoint = year ? `/api/admission/plans?year=${year}` : '/api/admission/plans';
  return fetchApi<IAdmissionPlan[]>(endpoint);
}

export async function getAdmissionResults(year?: number): Promise<IAdmissionResult[]> {
  const endpoint = year ? `/api/admission/results?year=${year}` : '/api/admission/results';
  return fetchApi<IAdmissionResult[]>(endpoint);
}

// ============================================================================
// Sync API
// ============================================================================

export async function triggerSync(type?: string): Promise<{ status: string; message: string }> {
  const endpoint = type ? `/api/sync?type=${encodeURIComponent(type)}` : '/api/sync';
  return fetchApi(endpoint, { method: 'POST' });
}

export async function getSyncStatus(): Promise<{ isParsing: boolean }> {
  return fetchApi('/api/sync/status');
}
