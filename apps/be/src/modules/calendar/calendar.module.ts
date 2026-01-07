import { Module } from '@nestjs/common';
import { CleaningModule } from '@src/modules/cleaning/cleaning.module';
import { OpentalkModule } from '@src/modules/opentalk/opentalk.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [CleaningModule, OpentalkModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
