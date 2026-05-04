export type DocumentCategoryType = 'GENERAL' | 'PAID_EDU' | 'STANDARDS' | 'GRANTS' | 'ADMISSION';

export class DocumentQueryDto {
  category?: DocumentCategoryType;
}
