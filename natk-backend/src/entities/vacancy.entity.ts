import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Company } from './company.entity';

@Entity('vacancies')
export class Vacancy {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Company, (company) => company.vacancies, { onDelete: 'CASCADE' })
  company!: Company;

  @Column()
  title!: string;

  @Column({ nullable: true })
  salary?: string;

  @Column({ type: 'text', nullable: true })
  descriptionHtml?: string;
}
