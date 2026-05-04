import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Unique } from 'typeorm';
import { Campus } from './campus.entity';
import { Group } from './group.entity';

@Entity('specialties')
@Unique(['code', 'campus'])
export class Specialty {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  code!: string;

  @Column()
  title!: string;

  @Column({ type: 'float', nullable: true })
  passingScore?: number;

  @Column({ type: 'int', default: 25 })
  budgetPlaces!: number;

  @ManyToOne(() => Campus, (campus) => campus.specialties, { onDelete: 'SET NULL' })
  campus?: Campus;

  @OneToMany(() => Group, (group) => group.specialty)
  groups!: Group[];
}
