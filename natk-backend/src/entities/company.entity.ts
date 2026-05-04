import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Vacancy } from './vacancy.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  contacts?: string;

  @OneToMany(() => Vacancy, (vacancy) => vacancy.company)
  vacancies!: Vacancy[];
}
