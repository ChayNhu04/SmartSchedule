import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity('tags')
@Index(['user_id'])
@Unique('tags_user_name_unique', ['user_id', 'name'])
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color!: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToMany(() => Schedule, (s) => s.tags)
  schedules?: Schedule[];
}
