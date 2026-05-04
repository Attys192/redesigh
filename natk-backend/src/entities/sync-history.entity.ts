import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('sync_history')
export class SyncHistory {
  @PrimaryColumn()
  type!: string; // 'schedule', 'news', 'staff', etc.

  @Column({ type: 'timestamp', precision: 3 })
  lastSyncAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3 })
  updatedAt!: Date;
}