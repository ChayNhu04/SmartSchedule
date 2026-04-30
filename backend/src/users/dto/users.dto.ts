import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsInt() @Min(0) @Max(720) default_remind_minutes?: number;
  @IsOptional() @IsBoolean() notify_via_push?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(23) work_start_hour?: number;
  @IsOptional() @IsInt() @Min(0) @Max(23) work_end_hour?: number;
}

export class RegisterPushTokenDto {
  @IsString() token!: string;
}
