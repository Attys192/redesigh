import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { NewsImage } from './news-image.entity';

@Entity('news')
export class News {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 500 })
  title!: string;

  @Column({ type: 'text', unique: true })
  url!: string;

  @Column({ type: 'date', nullable: true })
  publishedDate?: Date;

  @Column({ type: 'text', nullable: true })
  contentHtml?: string;

  @Column({ type: 'text', nullable: true })
  mainImageUrl?: string;

  @OneToMany(() => NewsImage, (image) => image.news)
  images!: NewsImage[];
}
