import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tag } from '../../tags/entities/tag.entity';

export type ScheduleStatus = 'pending' | 'completed' | 'cancelled';
export type ScheduleItemType = 'task' | 'meeting' | 'event' | 'reminder';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';
export type SchedulePriority = 'low' | 'normal' | 'high';

@Entity('schedules')
@Index(['user_id', 'start_time'])
@Index(['remind_at', 'is_reminded'])
export class Schedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'varchar', length: 20, default: 'task' })
  item_type!: ScheduleItemType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'timestamp with time zone' })
  start_time!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  end_time!: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: ScheduleStatus;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority!: SchedulePriority;

  @Column({ type: 'timestamp with time zone', nullable: true })
  remind_at!: Date | null;

  @Column({ type: 'boolean', default: false })
  is_reminded!: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  acknowledged_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  end_notified_at!: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'none' })
  recurrence_type!: RecurrenceType;

  @Column({ type: 'integer', default: 1 })
  recurrence_interval!: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  recurrence_until!: Date | null;

  @Column({ type: 'integer', nullable: true })
  recurrence_parent_id!: number | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at!: Date;

  @ManyToOne(() => User, (user) => user.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToMany(() => Tag, (tag) => tag.schedules)
  @JoinTable({
    name: 'schedule_tags',
    joinColumn: { name: 'schedule_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags?: Tag[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'schedule_shares',
    joinColumn: { name: 'schedule_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'shared_with_user_id', referencedColumnName: 'id' },
  })
  sharedWith?: User[];
}
