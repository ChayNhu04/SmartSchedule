import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings {
  @PrimaryColumn({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'varchar', length: 50, default: 'Asia/Ho_Chi_Minh' })
  timezone!: string;

  @Column({ type: 'integer', default: 30 })
  default_remind_minutes!: number;

  @Column({ type: 'boolean', default: true })
  notify_via_push!: boolean;

  @Column({ type: 'integer', default: 0 })
  work_start_hour!: number;

  @Column({ type: 'integer', default: 0 })
  work_end_hour!: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at!: Date;

  @OneToOne(() => User, (user) => user.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
