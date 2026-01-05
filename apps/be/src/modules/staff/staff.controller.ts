import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@src/common/constants/user.constants';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { StaffService } from '@src/modules/staff/staff.service';

@Controller('staffs')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  getStaffs(@Query() queries: AppPaginateOptionsDto): any {
    return this.staffService.getStaffs(queries);
  }
}
