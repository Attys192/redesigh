import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('admission_records')
@Unique(['registrationCode'])
export class AdmissionRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  registrationCode!: string;

  @Column()
  specialtyCode!: string;

  @Column({ type: 'float' })
  score!: number;

  @Column({ default: false })
  hasOriginal!: boolean;
}
