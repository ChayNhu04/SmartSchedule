import { ArrayNotEmpty, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTagDto {
  @IsString() @MaxLength(30) name!: string;
  @IsOptional() @IsString() @MaxLength(20) color?: string;
}

export class AttachTagsDto {
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) names!: string[];
}
