import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@qnoffice/shared';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { AppPaginationDto } from '@src/common/dtos/paginate.dto';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { CreatePenaltyTypeDto } from './dto/create-penalty-type.dto';
import { UpdatePenaltyTypeDto } from './dto/update-penalty-type.dto';
import { PenaltyTypeService } from './penalty-type.service';

@Controller('penalty-types')
@UseGuards(JwtAuthGuard)
export class PenaltyTypeController {
  constructor(private readonly penaltyTypeService: PenaltyTypeService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles([UserRole.HR])
  create(@Body() createPenaltyTypeDto: CreatePenaltyTypeDto) {
    return this.penaltyTypeService.create(createPenaltyTypeDto);
  }

  @Get()
  async findAll(
    @Query() queries: AppPaginateOptionsDto,
  ): Promise<AppPaginationDto<any>> {
    return this.penaltyTypeService.findAll(queries);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.penaltyTypeService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.HR])
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePenaltyTypeDto: UpdatePenaltyTypeDto,
  ) {
    return this.penaltyTypeService.update(id, updatePenaltyTypeDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles([UserRole.HR])
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.penaltyTypeService.remove(id);
  }
}
