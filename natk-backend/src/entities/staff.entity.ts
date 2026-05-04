import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { StaffPosition } from './staff-position.entity';
import { Schedule } from './schedule.entity';

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fullName!: string;

  @Column({ type: 'text', nullable: true })
  photoUrl?: string;

  @Column({ type: 'varchar', length: 20 })
  role!: 'CHIEF' | 'TEACHER';

  @Column({ type: 'text', nullable: true })
  profileUrl?: string;

  @Column({ type: 'text', nullable: true })
  bioHtml?: string;

  @Column({ type: 'simple-json', nullable: true })
  achievements?: string[];

  @OneToMany(() => StaffPosition, (position) => position.staff)
  positions!: StaffPosition[];

  @OneToMany(() => Schedule, (schedule) => schedule.teacher)
  schedules!: Schedule[];
}
