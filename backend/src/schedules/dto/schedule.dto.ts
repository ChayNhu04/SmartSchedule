import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const ITEM_TYPES = ['task', 'meeting', 'event', 'reminder'] as const;
const STATUSES = ['pending', 'completed', 'cancelled'] as const;
const PRIORITIES = ['low', 'normal', 'high'] as const;
const RECURRENCES = ['none', 'daily', 'weekly', 'monthly'] as const;

export class CreateScheduleDto {
  @IsString() @MaxLength(255) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() start_time!: string;
  @IsOptional() @IsDateString() end_time?: string;
  @IsOptional() @IsDateString() remind_at?: string;
  @IsOptional() @IsIn(ITEM_TYPES as unknown as string[]) item_type?: (typeof ITEM_TYPES)[number];
  @IsOptional() @IsIn(PRIORITIES as unknown as string[]) priority?: (typeof PRIORITIES)[number];
  @IsOptional() @IsIn(RECURRENCES as unknown as string[]) recurrence_type?: (typeof RECURRENCES)[number];
  @IsOptional() @IsInt() @Min(1) recurrence_interval?: number;
  @IsOptional() @IsDateString() recurrence_until?: string;
}

export class UpdateScheduleDto {
  @IsOptional() @IsString() @MaxLength(255) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() start_time?: string;
  @IsOptional() @IsDateString() end_time?: string;
  @IsOptional() @IsDateString() remind_at?: string;
  @IsOptional() @IsIn(ITEM_TYPES as unknown as string[]) item_type?: (typeof ITEM_TYPES)[number];
  @IsOptional() @IsIn(STATUSES as unknown as string[]) status?: (typeof STATUSES)[number];
  @IsOptional() @IsIn(PRIORITIES as unknown as string[]) priority?: (typeof PRIORITIES)[number];
  @IsOptional() @IsIn(RECURRENCES as unknown as string[]) recurrence_type?: (typeof RECURRENCES)[number];
  @IsOptional() @IsInt() @Min(1) recurrence_interval?: number;
  @IsOptional() @IsDateString() recurrence_until?: string;
  @IsOptional() @IsBoolean() is_reminded?: boolean;
}

export class QueryScheduleDto {
  @IsOptional() @IsIn(STATUSES as unknown as string[]) status?: (typeof STATUSES)[number];
  @IsOptional() @IsIn(PRIORITIES as unknown as string[]) priority?: (typeof PRIORITIES)[number];
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
}
