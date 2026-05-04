import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Specialty } from './specialty.entity';
import { Schedule } from './schedule.entity';
import { Course } from './course.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @ManyToOne(() => Specialty, (specialty) => specialty.groups, { onDelete: 'SET NULL' })
  specialty?: Specialty;

  @ManyToOne(() => Course, (course) => course.groups, { onDelete: 'SET NULL' })
  course?: Course;

  @OneToMany(() => Schedule, (schedule) => schedule.group)
  schedules!: Schedule[];
}
