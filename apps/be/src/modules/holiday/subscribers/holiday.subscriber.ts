import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';
import HolidayEntity from '../holiday.entity';

@EventSubscriber()
export class HolidaySubscriber
  implements EntitySubscriberInterface<HolidayEntity>
{
  constructor(dataSource: DataSource) {
    if (dataSource?.subscribers) {
      dataSource.subscribers.push(this);
    }
  }

  listenTo() {
    return HolidayEntity;
  }

  // async afterInsert(event: InsertEvent<HolidayEntity>) {
  //   const holidayDate = toDateString(new Date(event.entity.date));
  //   await this.scheduleReschedulingService.handleHolidayChange(
  //     holidayDate,
  //     'create',
  //     event.manager,
  //   );
  // }

  // async afterUpdate(event: UpdateEvent<HolidayEntity>) {
  //   if (event.entity?.date) {
  //     const holidayDate = toDateString(new Date(event.entity.date));
  //     await this.scheduleReschedulingService.handleHolidayChange(
  //       holidayDate,
  //       'update',
  //       event.manager,
  //     );
  //   }
  // }

  // async afterRemove(event: RemoveEvent<HolidayEntity>) {
  //   if (event.entity?.date) {
  //     const holidayDate = toDateString(new Date(event.entity.date));
  //     await this.scheduleReschedulingService.handleHolidayChange(
  //       holidayDate,
  //       'remove',
  //       event.manager,
  //     );
  //   }
  // }
}
