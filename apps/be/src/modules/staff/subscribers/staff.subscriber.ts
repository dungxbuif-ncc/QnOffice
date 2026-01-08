import { Logger } from '@nestjs/common';
import { StaffStatus } from '@qnoffice/shared';
import { OpentalkStaffService } from '@src/modules/schedule/services/opentalk-staff.schedule.service';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';
import StaffEntity from '../staff.entity';

@EventSubscriber()
export class StaffSubscriber implements EntitySubscriberInterface<StaffEntity> {
  private readonly logger = new Logger(StaffSubscriber.name);
  private opentalkStaffService: OpentalkStaffService;

  constructor(dataSource: DataSource) {
    if (dataSource?.subscribers) {
      dataSource.subscribers.push(this);
    }
  }

  setOpentalkStaffService(service: OpentalkStaffService) {
    this.opentalkStaffService = service;
  }

  listenTo() {
    return StaffEntity;
  }

  async afterUpdate(event: UpdateEvent<StaffEntity>) {
    if (!event.entity || !event.databaseEntity) return;

    const oldStatus = event.databaseEntity.status;
    const newStatus = event.entity.status;

    if (oldStatus === newStatus) return;

    if (newStatus === StaffStatus.ACTIVE && oldStatus !== StaffStatus.ACTIVE) {
      this.logger.log(
        `Staff ${event.entity.email} became ACTIVE. Triggering schedule adjustments.`,
      );

      if (this.opentalkStaffService) {
        await this.opentalkStaffService.handleNewStaff(
          event.entity as StaffEntity,
        );
      }
    } else if (
      oldStatus === StaffStatus.ACTIVE &&
      newStatus !== StaffStatus.ACTIVE
    ) {
      this.logger.log(
        `Staff ${event.entity.email} became INACTIVE. Triggering schedule adjustments.`,
      );

      if (this.opentalkStaffService) {
        await this.opentalkStaffService.handleStaffLeave(
          event.entity as StaffEntity,
        );
      }
    }
  }
}
