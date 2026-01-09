import { Logger } from '@nestjs/common';
import { StaffStatus } from '@qnoffice/shared';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import { OpentalkStaffService } from '@src/modules/schedule/services/opentalk-staff.schedule.service';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import StaffEntity from '../staff.entity';

@EventSubscriber()
export class StaffSubscriber implements EntitySubscriberInterface<StaffEntity> {
  private readonly logger = new Logger(StaffSubscriber.name);
  private opentalkStaffService: OpentalkStaffService;
  private appLogService: AppLogService;

  constructor() {}

  setOpentalkStaffService(service: OpentalkStaffService) {
    this.opentalkStaffService = service;
  }

  setAppLogService(service: AppLogService) {
    this.appLogService = service;
  }

  listenTo() {
    return StaffEntity;
  }

  async afterUpdate(event: UpdateEvent<StaffEntity>) {
    if (!event.entity || !event.databaseEntity) return;

    const oldStatus = event.databaseEntity.status;
    const newStatus = event.entity.status;

    if (oldStatus === newStatus) return;

    const journeyId = uuidv4();
    const staff = event.entity as StaffEntity;

    if (newStatus === StaffStatus.ACTIVE && oldStatus !== StaffStatus.ACTIVE) {
      this.logger.log(
        `Staff ${staff.email} became ACTIVE. Triggering schedule adjustments.`,
      );

      if (this.appLogService) {
        this.appLogService.journeyLog(
          journeyId,
          `Staff status change: ${staff.email} became ACTIVE`,
          'StaffSubscriber',
          { staffId: staff.id, oldStatus, newStatus },
        );
      }

      if (this.opentalkStaffService) {
        if (this.appLogService) {
          this.appLogService.stepLog(
            1,
            'Calling handleNewStaff to adjust schedules',
            'StaffSubscriber',
            journeyId,
            { staffEmail: staff.email },
          );
        }

        try {
          await this.opentalkStaffService.handleNewStaff(staff);

          if (this.appLogService) {
            this.appLogService.journeyLog(
              journeyId,
              'Successfully handled new active staff schedule adjustments',
              'StaffSubscriber',
            );
          }
        } catch (error) {
          if (this.appLogService) {
            this.appLogService.journeyError(
              journeyId,
              'Failed to handle new active staff schedule adjustments',
              error.stack,
              'StaffSubscriber',
              { error: error.message },
            );
          }
        }
      }
    } else if (
      oldStatus === StaffStatus.ACTIVE &&
      newStatus !== StaffStatus.ACTIVE
    ) {
      this.logger.log(
        `Staff ${staff.email} became INACTIVE. Triggering schedule adjustments.`,
      );

      if (this.appLogService) {
        this.appLogService.journeyLog(
          journeyId,
          `Staff status change: ${staff.email} became INACTIVE`,
          'StaffSubscriber',
          { staffId: staff.id, oldStatus, newStatus },
        );
      }

      if (this.opentalkStaffService) {
        if (this.appLogService) {
          this.appLogService.stepLog(
            1,
            'Calling handleStaffLeave to adjust schedules',
            'StaffSubscriber',
            journeyId,
            { staffEmail: staff.email },
          );
        }

        try {
          await this.opentalkStaffService.handleStaffLeave(staff);

          if (this.appLogService) {
            this.appLogService.journeyLog(
              journeyId,
              'Successfully handled staff leave schedule adjustments',
              'StaffSubscriber',
            );
          }
        } catch (error) {
          if (this.appLogService) {
            this.appLogService.journeyError(
              journeyId,
              'Failed to handle staff leave schedule adjustments',
              error.stack,
              'StaffSubscriber',
              { error: error.message },
            );
          }
        }
      }
    }
  }
}
