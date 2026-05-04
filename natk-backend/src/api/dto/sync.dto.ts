export type SyncType =
  | 'specialties'
  | 'specialty-profiles'
  | 'admission'
  | 'news'
  | 'staff'
  | 'docs'
  | 'vacancies'
  | 'schedule'
  | 'structure';

export class SyncQueryDto {
  type?: SyncType;
}
