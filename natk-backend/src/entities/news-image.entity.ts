import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { News } from './news.entity';

@Entity('news_images')
export class NewsImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => News, (news) => news.images, { onDelete: 'CASCADE' })
  news!: News;

  @Column({ type: 'text' })
  imageUrl!: string;
}
