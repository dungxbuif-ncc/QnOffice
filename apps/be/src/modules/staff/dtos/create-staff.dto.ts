import { UserRole } from '@qnoffice/shared';
import { IsEmail, IsEnum, IsNumber } from 'class-validator';

export default class CreateStaffDto {
  @IsEmail()
  email: string;

  @IsNumber()
  branchId: number;

  @IsEnum(UserRole)
  role: UserRole;
}
