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
import { ApiTags } from '@nestjs/swagger';
import { Branch as IBranch, IPaginationDto, UserRole } from '@qnoffice/shared';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { BranchService } from './branch.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Controller('branches')
@ApiTags('Branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(
    @Query() queries: AppPaginateOptionsDto,
  ): Promise<IPaginationDto<IBranch>> {
    return this.branchService.findAll(queries) as any;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<IBranch | null> {
    return this.branchService.findOne(+id) as any;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async create(@Body() branchData: CreateBranchDto): Promise<IBranch> {
    return this.branchService.create(branchData) as any;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR, UserRole.GDVP])
  async update(
    @Param('id') id: string,
    @Body() branchData: UpdateBranchDto,
  ): Promise<IBranch | null> {
    return this.branchService.update(+id, branchData) as any;
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.branchService.remove(+id);
  }
}
