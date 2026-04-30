import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserSettings } from './user-settings.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  display_name!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  expo_push_token!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at!: Date;

  @OneToOne(() => UserSettings, (s) => s.user)
  settings?: UserSettings;

  @OneToMany(() => Schedule, (s) => s.user)
  schedules?: Schedule[];
}
