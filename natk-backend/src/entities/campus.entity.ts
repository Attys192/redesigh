import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Specialty } from './specialty.entity';

@Entity('campuses')
export class Campus {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  address!: string;

  @OneToMany(() => Specialty, (specialty) => specialty.campus)
  specialties!: Specialty[];
}
