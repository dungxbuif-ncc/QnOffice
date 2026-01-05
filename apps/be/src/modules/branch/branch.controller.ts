import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@src/common/constants/user.constants';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { BranchEntity } from '@src/modules/branch/branch.entity';
import { BranchService } from './branch.service';

@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  findAll(
    @Query() queries: AppPaginateOptionsDto,
  ): Promise<AppPaginationDto<BranchEntity>> {
    return this.branchService.findAll(queries);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BranchEntity | null> {
    return this.branchService.findOne(+id);
  }

  @Post()
  create(@Body() branchData: Partial<BranchEntity>): Promise<BranchEntity> {
    return this.branchService.create(branchData);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() branchData: Partial<BranchEntity>,
  ): Promise<BranchEntity | null> {
    return this.branchService.update(+id, branchData);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.branchService.remove(+id);
  }
}
