import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  userMezonId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  messageId!: string;

  @IsString()
  @IsOptional()
  channelId?: string;

  @IsDateString()
  @IsNotEmpty()
  date!: string;
}
