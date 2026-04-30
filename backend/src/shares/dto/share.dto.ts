import { IsUUID } from 'class-validator';

export class ShareTargetDto {
  @IsUUID() target_user_id!: string;
}
