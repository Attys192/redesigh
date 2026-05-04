import axios from 'axios';
import { 
  ISchedule, 
  INews, 
  IStaff, 
  IDocument, 
  IVacancy, 
  ISpecialty, 
  ICampus, 
  IGroup, 
  IDepartment,
  IAdmissionStatus,
  IGroupedLesson 
} from '../types';

// Базовый URL - используй свой IP адрес вместо localhost для реального устройства
// Для эмулятора Android можно использовать 10.0.2.2
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3005';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// Schedule API
// ============================================================================

export const getGroups = async (): Promise<string[]> => {
  const response = await api.get('/api/schedule/groups');
  return response.data;
};

export const getSchedule = async (groupName: string): Promise<ISchedule[]> => {
  const response = await api.get(`/api/schedule?group=${encodeURIComponent(groupName)}`);
  return response.data;
};

export const getScheduleByTeacher = async (teacherName: string): Promise<ISchedule[]> => {
  const response = await api.get(`/api/schedule?teacher=${encodeURIComponent(teacherName)}`);
  return response.data;
};

// ============================================================================
// News API
// ============================================================================

export const getNews = async (): Promise<INews[]> => {
  const response = await api.get('/api/news');
  return response.data;
};

// ============================================================================
// Staff API
// ============================================================================

export const getStaff = async (): Promise<IStaff[]> => {
  const response = await api.get('/api/staff');
  return response.data;
};

export const getStaffById = async (id: number): Promise<IStaff> => {
  const response = await api.get(`/api/staff/${id}`);
  return response.data;
};

export const searchStaff = async (name: string): Promise<IStaff[]> => {
  const response = await api.get(`/api/staff/find?name=${encodeURIComponent(name)}`);
  return response.data;
};

export const getChiefs = async (): Promise<IStaff[]> => {
  const response = await api.get('/api/staff');
  return response.data.filter((s: IStaff) => s.role === 'CHIEF');
};

export const getTeachers = async (): Promise<IStaff[]> => {
  const response = await api.get('/api/staff');
  return response.data.filter((s: IStaff) => s.role === 'TEACHER');
};

// ============================================================================
// Documents API
// ============================================================================

export const getDocuments = async (category?: string): Promise<IDocument[]> => {
  const endpoint = category 
    ? `/api/documents?category=${encodeURIComponent(category)}`
    : '/api/documents';
  const response = await api.get(endpoint);
  return response.data;
};

export const getAdmissionDocuments = async (): Promise<IDocument[]> => {
  const response = await api.get('/api/documents/admission');
  return response.data;
};

// ============================================================================
// Vacancies API
// ============================================================================

export const getVacancies = async (): Promise<IVacancy[]> => {
  const response = await api.get('/api/vacancies');
  return response.data;
};

// ============================================================================
// Specialties API
// ============================================================================

export const getSpecialties = async (): Promise<ISpecialty[]> => {
  const response = await api.get('/api/specialties');
  return response.data;
};

// ============================================================================
// Campuses API
// ============================================================================

export const getCampuses = async (): Promise<ICampus[]> => {
  const response = await api.get('/api/campuses');
  return response.data;
};

// ============================================================================
// Groups API
// ============================================================================

export const getAllGroups = async (): Promise<IGroup[]> => {
  const response = await api.get('/api/groups');
  return response.data;
};

// ============================================================================
// Departments API
// ============================================================================

export const getDepartments = async (): Promise<IDepartment[]> => {
  const response = await api.get('/api/departments');
  return response.data;
};

// ============================================================================
// Admission API
// ============================================================================

export const getAdmissionStatus = async (code: string): Promise<IAdmissionStatus> => {
  const response = await api.get(`/api/admission/status/${encodeURIComponent(code)}`);
  return response.data;
};

// ============================================================================
// Sync API
// ============================================================================

export const triggerSync = async (type?: string): Promise<{ status: string; message: string }> => {
  const endpoint = type ? `/api/sync?type=${encodeURIComponent(type)}` : '/api/sync';
  const response = await api.post(endpoint);
  return response.data;
};

export const getSyncStatus = async (): Promise<{ isParsing: boolean }> => {
  const response = await api.get('/api/sync/status');
  return response.data;
};

export default api;
