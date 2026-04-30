import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const ITEM_TYPES = ['task', 'meeting', 'event', 'reminder'] as const;
const PRIORITIES = ['low', 'normal', 'high'] as const;

export class CreateTemplateDto {
  @IsString() @MaxLength(50) name!: string;
  @IsString() @MaxLength(255) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(ITEM_TYPES as unknown as string[]) item_type?: (typeof ITEM_TYPES)[number];
  @IsOptional() @IsInt() @Min(1) duration_minutes?: number;
  @IsOptional() @IsInt() @Min(0) default_remind_minutes?: number;
  @IsOptional() @IsIn(PRIORITIES as unknown as string[]) priority?: (typeof PRIORITIES)[number];
}

export class InstantiateTemplateDto {
  @IsDateString() start_time!: string;
}
