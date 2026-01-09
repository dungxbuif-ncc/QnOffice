import { ISubmitSlideDto } from '@qnoffice/shared';
import { IsNumber, IsString } from 'class-validator';
export class SubmitSlideDto implements ISubmitSlideDto {
  @IsNumber()
  eventId: number;

  @IsString()
  slidesUrl: string;
}
