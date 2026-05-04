import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { DocumentCategory } from './document-category.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', unique: true })
  fileUrl!: string;

  @ManyToOne(() => DocumentCategory, (category) => category.documents)
  category!: DocumentCategory;
}
