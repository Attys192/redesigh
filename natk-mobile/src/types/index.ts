// Import shared types
import type {
  INewsImage as SharedINewsImage,
  INews as SharedINews,
  IStaffPosition as SharedIStaffPosition,
  IStaff as SharedIStaff,
  ICompany as SharedICompany,
  IVacancy as SharedIVacancy,
  ICampus as SharedICampus,
  ISpecialty as SharedISpecialty,
  IGroup as SharedIGroup,
  ISubject as SharedISubject,
  IRoom as SharedIRoom,
  ISchedule as SharedISchedule,
  IDocumentCategory as SharedIDocumentCategory,
  IDocument as SharedIDocument,
  IDepartment as SharedIDepartment,
  IAdmissionStatus as SharedIAdmissionStatus,
  IGroupedLesson as SharedIGroupedLesson,
  ISubgroupInfo as SharedISubgroupInfo,
  StaffRole,
  DocumentCategoryType,
  UserRole,
} from '../../../shared-types';

// Re-export all shared types
export type {
  SharedINewsImage as INewsImage,
  SharedINews as INews,
  SharedIStaffPosition as IStaffPosition,
  SharedIStaff as IStaff,
  SharedICompany as ICompany,
  SharedIVacancy as IVacancy,
  SharedICampus as ICampus,
  SharedISpecialty as ISpecialty,
  SharedIGroup as IGroup,
  SharedISubject as ISubject,
  SharedIRoom as IRoom,
  SharedISchedule as ISchedule,
  SharedIDocumentCategory as IDocumentCategory,
  SharedIDocument as IDocument,
  SharedIDepartment as IDepartment,
  SharedIAdmissionStatus as IAdmissionStatus,
  SharedIGroupedLesson as IGroupedLesson,
  SharedISubgroupInfo as ISubgroupInfo,
  StaffRole,
  DocumentCategoryType,
  UserRole,
};

// Mobile-specific aliases for backward compatibility
export type IStaffFull = SharedIStaff;
export type GroupedLesson = SharedIGroupedLesson;
