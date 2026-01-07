import { PartialType } from '@nestjs/mapped-types';
import { CreatePenaltyTypeDto } from './create-penalty-type.dto';

export class UpdatePenaltyTypeDto extends PartialType(CreatePenaltyTypeDto) {}
