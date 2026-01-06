import StaffEntity from '@src/modules/staff/staff.entity';
import UserEntity from '@src/modules/user/user.entity';
import {
  EventSubscriber,
  IsNull,
  type EntitySubscriberInterface,
  type InsertEvent,
} from 'typeorm';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<UserEntity> {
  listenTo(): typeof UserEntity {
    return UserEntity;
  }

  async afterInsert(
    event: InsertEvent<UserEntity>,
  ): Promise<Promise<Promise<any> | void>> {
    const manager = event?.manager;
    if (!manager || !event?.entity?.email) return;
    const existStaff = await manager.findOneBy(StaffEntity, {
      email: event.entity.email,
      userId: IsNull(),
    });
    if (existStaff) {
      existStaff.userId = event.entity.mezonId;
      await manager.save(StaffEntity, existStaff);
    }
  }
}
