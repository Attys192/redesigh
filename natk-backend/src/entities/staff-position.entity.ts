import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Staff } from './staff.entity';

@Entity('staff_positions')
export class StaffPosition {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Staff, (staff) => staff.positions, { onDelete: 'CASCADE' })
  staff!: Staff;

  @Column()
  positionName!: string;
}
