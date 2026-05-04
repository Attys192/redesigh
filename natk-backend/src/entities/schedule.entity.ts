import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Group } from './group.entity';
import { Subject } from './subject.entity';
import { Staff } from './staff.entity';
import { Room } from './room.entity';

@Entity('schedule')
export class Schedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Group, (group) => group.schedules, { onDelete: 'CASCADE' })
  group!: Group;

  @ManyToOne(() => Subject, (subject) => subject.schedules)
  subject!: Subject;

  @ManyToOne(() => Staff, (staff) => staff.schedules, { nullable: true })
  teacher?: Staff;

  @ManyToOne(() => Room, (room) => room.schedules, { nullable: true })
  room?: Room;

  @Column({ type: 'date' })
  lessonDate!: Date;

  @Column()
  dayOfWeek!: string;

  @Column()
  lessonNumber!: number;

  @Column({ nullable: true })
  startTime?: string;

  @Column({ default: false })
  isSubgroup!: boolean;

  @Column({ nullable: true })
  subgroupNumber?: number;
}
