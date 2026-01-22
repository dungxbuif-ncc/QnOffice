import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IPaginationDto, Staff, UserRole } from '@qnoffice/shared';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import CreateStaffDto from '@src/modules/staff/dtos/create-staff.dto';
import UpdateStaffUserIdDto from '@src/modules/staff/dtos/update-staff-userid.dto';
import { StaffService } from '@src/modules/staff/staff.service';

@Controller('staffs')
@ApiTags('Staffs')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('by-user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getStaffByUserId(
    @Param('userId') userId: string,
  ): Promise<Staff | null> {
    return this.staffService.findByUserId(userId) as any;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  getStaffs(
    @Query() queries: AppPaginateOptionsDto,
  ): Promise<IPaginationDto<Staff>> {
    return this.staffService.getStaffs(queries) as any;
  }

  @Get('active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAllActiveStaff(): Promise<Staff[]> {
    return this.staffService.getAllActiveStaff() as any;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getStaffById(@Param('id') id: number): Promise<Staff | null> {
    return this.staffService.findById(id) as any;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async createStaff(@Body() body: CreateStaffDto): Promise<Staff> {
    return this.staffService.createStaff(body) as any;
  }

  @Put(':id/mezon-id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async updateStaffUserId(
    @Param('id') id: number,
    @Body() body: UpdateStaffUserIdDto,
  ) {
    return this.staffService.updateStaffUserId(id, body.userId || null);
  }
}
