import { Logger } from '@nestjs/common';
import { StaffStatus } from '@qnoffice/shared';
import { DataSource, UpdateEvent } from 'typeorm';
import { OpentalkStaffService } from '../src/modules/schedule/services/opentalk-staff.schedule.service';
import StaffEntity from '../src/modules/staff/staff.entity';
import { StaffSubscriber } from '../src/modules/staff/subscribers/staff.subscriber';

describe('StaffSubscriber - Staff Status Change Handling', () => {
  let staffSubscriber: StaffSubscriber;
  let mockOpentalkStaffService: jest.Mocked<OpentalkStaffService>;
  let mockDataSource: jest.Mocked<DataSource>;

  // Mock staff data for realistic testing
  const mockStaffData = [
    { id: 138058548, email: 'dung.buihuu@ncc.asia', name: 'Dung Bui Huu' },
    { id: 1856470380, email: 'dung.phammanh@ncc.asia', name: 'Dung Pham Manh' },
    { id: 93915151, email: 'duy.huynhle@ncc.asia', name: 'Duy Huynh Le' },
    { id: 76960340, email: 'duy.nguyenxuan@ncc.asia', name: 'Duy Nguyen Xuan' },
    { id: 1712760209, email: 'du.levanky@ncc.asia', name: 'Du Le Van Ky' },
    { id: 1521328894, email: 'dat.haquoc@ncc.asia', name: 'Dat Ha Quoc' },
    {
      id: 1951973805,
      email: 'hien.nguyenthanh@ncc.asia',
      name: 'Hien Nguyen Thanh',
    },
  ];

  function createMockStaff(
    staffInfo: (typeof mockStaffData)[0],
    status: StaffStatus,
  ): StaffEntity {
    return {
      id: staffInfo.id,
      email: staffInfo.email,
      name: staffInfo.name,
      status: status,
      branchId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as StaffEntity;
  }

  function logTestScenario(
    title: string,
    scenario: {
      staff: StaffEntity;
      oldStatus: StaffStatus;
      newStatus: StaffStatus;
      description: string;
    },
  ) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 ${title}`);
    console.log('='.repeat(80));
    console.log(`Staff Information:`);
    console.log(`  👤 ID: ${scenario.staff.id}`);
    console.log(`  📧 Email: ${scenario.staff.email}`);
    console.log(`  👨‍💼 Name: ${scenario.staff.name}`);
    console.log(`  🏢 Branch ID: ${scenario.staff.branchId}`);
    console.log('');
    console.log(`Status Change:`);
    console.log(`  📊 Old Status: ${scenario.oldStatus}`);
    console.log(`  ➡️  New Status: ${scenario.newStatus}`);
    console.log('');
    console.log(`Scenario Description:`);
    console.log(`  📝 ${scenario.description}`);
    console.log('='.repeat(80));
  }

  function logExpectedBehavior(behavior: {
    shouldTriggerHandleStaffLeave?: boolean;
    shouldTriggerHandleNewStaff?: boolean;
    shouldNotTriggerAnyHandler?: boolean;
    details: string[];
  }) {
    console.log(`\n🎯 Expected Behavior:`);
    if (behavior.shouldTriggerHandleStaffLeave) {
      console.log(`  ✅ Should trigger handleStaffLeave()`);
    }
    if (behavior.shouldTriggerHandleNewStaff) {
      console.log(`  ✅ Should trigger handleNewStaff()`);
    }
    if (behavior.shouldNotTriggerAnyHandler) {
      console.log(`  ❌ Should NOT trigger any handler`);
    }

    console.log(`\n📋 Detailed Expectations:`);
    behavior.details.forEach((detail, index) => {
      console.log(`  ${index + 1}. ${detail}`);
    });
    console.log('');
  }

  function logTestResult(result: {
    success: boolean;
    actualCalls: {
      handleStaffLeave: number;
      handleNewStaff: number;
    };
    details: string[];
  }) {
    console.log(`\n📊 Test Results:`);
    console.log(`  Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`\n🔢 Method Call Counts:`);
    console.log(
      `  handleStaffLeave: ${result.actualCalls.handleStaffLeave} calls`,
    );
    console.log(`  handleNewStaff: ${result.actualCalls.handleNewStaff} calls`);

    console.log(`\n📝 Verification Details:`);
    result.details.forEach((detail, index) => {
      console.log(`  ${index + 1}. ${detail}`);
    });
    console.log('='.repeat(80));
  }

  beforeEach(() => {
    // Create mock DataSource
    mockDataSource = {
      subscribers: [],
    } as jest.Mocked<DataSource>;

    // Create mock OpentalkStaffService with proper typing
    mockOpentalkStaffService = {
      handleStaffLeave: jest.fn().mockResolvedValue({ before: [], after: [] }),
      handleNewStaff: jest.fn().mockResolvedValue({ before: [], after: [] }),
    } as jest.Mocked<OpentalkStaffService>;

    // Initialize subscriber
    staffSubscriber = new StaffSubscriber(mockDataSource);
    staffSubscriber.setOpentalkStaffService(mockOpentalkStaffService);

    // Mock Logger to avoid console spam during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Staff Leave Scenarios', () => {
    it('Case 1: Staff LEAVED in current Cycle - have upcoming event => only shift event from the event of staff till end', async () => {
      // Arrange: Create staff that is leaving (ACTIVE -> INACTIVE)
      const leavingStaff = createMockStaff(
        mockStaffData[2],
        StaffStatus.INACTIVE,
      );
      const oldStaff = createMockStaff(mockStaffData[2], StaffStatus.ACTIVE);

      const testScenario = {
        staff: leavingStaff,
        oldStatus: StaffStatus.ACTIVE,
        newStatus: StaffStatus.INACTIVE,
        description: `Staff member ${leavingStaff.name} is leaving the company. This staff has upcoming OpenTalk events scheduled in the current cycle. The system should automatically shift all events from this staff's upcoming slot until the end of the cycle to maintain the scheduling integrity.`,
      };

      logTestScenario(
        'TEST CASE 1: Staff Leave - Current Cycle with Upcoming Events',
        testScenario,
      );

      const expectedBehavior = {
        shouldTriggerHandleStaffLeave: true,
        details: [
          `handleStaffLeave() should be called with the leaving staff entity`,
          `System should identify all future events assigned to the leaving staff`,
          `All events after the leaving staff's next scheduled event should be shifted forward`,
          `No new events should be created, only existing events should be rescheduled`,
          `Past events of the leaving staff should remain unchanged`,
          `Other staff members' schedules should be adjusted to fill the gap`,
          `The leaving staff should be completely removed from future schedules`,
        ],
      };

      logExpectedBehavior(expectedBehavior);

      // Create mock UpdateEvent
      const mockUpdateEvent: UpdateEvent<StaffEntity> = {
        entity: leavingStaff,
        databaseEntity: oldStaff,
        manager: {} as any,
        connection: {} as any,
        queryRunner: {} as any,
        updatedColumns: [],
        updatedRelations: [],
      };

      console.log(`\n🚀 Executing afterUpdate() method...`);

      // Act: Trigger the subscriber method
      await staffSubscriber.afterUpdate(mockUpdateEvent);

      // Assert: Verify the correct method was called
      const actualCalls = {
        handleStaffLeave:
          mockOpentalkStaffService.handleStaffLeave.mock.calls.length,
        handleNewStaff:
          mockOpentalkStaffService.handleNewStaff.mock.calls.length,
      };

      const verificationDetails = [
        `handleStaffLeave was called ${actualCalls.handleStaffLeave} time(s) - Expected: 1`,
        `handleNewStaff was called ${actualCalls.handleNewStaff} time(s) - Expected: 0`,
        actualCalls.handleStaffLeave === 1
          ? '✅ Correct method called'
          : '❌ Wrong method called or count mismatch',
        `Staff entity passed to handleStaffLeave: ${mockOpentalkStaffService.handleStaffLeave.mock.calls[0]?.[0]?.email || 'None'}`,
        `Method triggered due to status change: ${StaffStatus.ACTIVE} → ${StaffStatus.INACTIVE}`,
      ];

      const testResult = {
        success:
          actualCalls.handleStaffLeave === 1 &&
          actualCalls.handleNewStaff === 0,
        actualCalls,
        details: verificationDetails,
      };

      logTestResult(testResult);

      // Detailed assertions
      expect(mockOpentalkStaffService.handleStaffLeave).toHaveBeenCalledTimes(
        1,
      );
      expect(mockOpentalkStaffService.handleStaffLeave).toHaveBeenCalledWith(
        leavingStaff,
      );
      expect(mockOpentalkStaffService.handleNewStaff).not.toHaveBeenCalled();

      // Verify the staff entity details passed to the method
      const calledWithStaff =
        mockOpentalkStaffService.handleStaffLeave.mock.calls[0][0];
      expect(calledWithStaff).toBeDefined();
      expect(calledWithStaff.id).toBe(leavingStaff.id);
      expect(calledWithStaff.email).toBe(leavingStaff.email);
      expect(calledWithStaff.status).toBe(StaffStatus.INACTIVE);
    });
  });

  describe('Edge Cases and Data Integrity', () => {
    it('Should not trigger any handler when entity or databaseEntity is missing', async () => {
      const testScenario = {
        staff: createMockStaff(mockStaffData[0], StaffStatus.ACTIVE),
        oldStatus: StaffStatus.ACTIVE,
        newStatus: StaffStatus.ACTIVE,
        description:
          'Testing edge case where UpdateEvent has missing entity or databaseEntity. This should not trigger any schedule adjustments.',
      };

      logTestScenario('TEST CASE: Missing Entity Data', testScenario);

      const expectedBehavior = {
        shouldNotTriggerAnyHandler: true,
        details: [
          'No handleStaffLeave() should be called',
          'No handleNewStaff() should be called',
          'System should gracefully handle missing data without errors',
          'Prevents unnecessary schedule calculations when data is incomplete',
        ],
      };

      logExpectedBehavior(expectedBehavior);

      // Test case 1: Missing entity
      const mockUpdateEventNoEntity: UpdateEvent<StaffEntity> = {
        entity: undefined as any,
        databaseEntity: createMockStaff(mockStaffData[0], StaffStatus.ACTIVE),
        manager: {} as any,
        connection: {} as any,
        queryRunner: {} as any,
        updatedColumns: [],
        updatedRelations: [],
      };

      console.log(`\n🚀 Testing with missing entity...`);
      await staffSubscriber.afterUpdate(mockUpdateEventNoEntity);

      // Test case 2: Missing databaseEntity
      const mockUpdateEventNoDbEntity: UpdateEvent<StaffEntity> = {
        entity: createMockStaff(mockStaffData[0], StaffStatus.ACTIVE),
        databaseEntity: undefined as any,
        manager: {} as any,
        connection: {} as any,
        queryRunner: {} as any,
        updatedColumns: [],
        updatedRelations: [],
      };

      console.log(`🚀 Testing with missing databaseEntity...`);
      await staffSubscriber.afterUpdate(mockUpdateEventNoDbEntity);

      const actualCalls = {
        handleStaffLeave:
          mockOpentalkStaffService.handleStaffLeave.mock.calls.length,
        handleNewStaff:
          mockOpentalkStaffService.handleNewStaff.mock.calls.length,
      };

      const verificationDetails = [
        `Total handleStaffLeave calls: ${actualCalls.handleStaffLeave} - Expected: 0`,
        `Total handleNewStaff calls: ${actualCalls.handleNewStaff} - Expected: 0`,
        'System properly handled missing data without triggering schedule changes',
        'No errors thrown during execution',
      ];

      const testResult = {
        success:
          actualCalls.handleStaffLeave === 0 &&
          actualCalls.handleNewStaff === 0,
        actualCalls,
        details: verificationDetails,
      };

      logTestResult(testResult);

      expect(mockOpentalkStaffService.handleStaffLeave).not.toHaveBeenCalled();
      expect(mockOpentalkStaffService.handleNewStaff).not.toHaveBeenCalled();
    });

    it('Should not trigger any handler when status does not change', async () => {
      const staff = createMockStaff(mockStaffData[0], StaffStatus.ACTIVE);

      const testScenario = {
        staff: staff,
        oldStatus: StaffStatus.ACTIVE,
        newStatus: StaffStatus.ACTIVE,
        description:
          'Staff entity is updated but status remains unchanged. This should not trigger any schedule adjustments since the staff availability has not changed.',
      };

      logTestScenario('TEST CASE: No Status Change', testScenario);

      const expectedBehavior = {
        shouldNotTriggerAnyHandler: true,
        details: [
          'No handleStaffLeave() should be called since staff is not leaving',
          'No handleNewStaff() should be called since staff is not becoming active',
          'System should efficiently skip schedule changes when status unchanged',
          'Prevents unnecessary database operations and schedule recalculations',
        ],
      };

      logExpectedBehavior(expectedBehavior);

      const mockUpdateEvent: UpdateEvent<StaffEntity> = {
        entity: staff,
        databaseEntity: createMockStaff(mockStaffData[0], StaffStatus.ACTIVE),
        manager: {} as any,
        connection: {} as any,
        queryRunner: {} as any,
        updatedColumns: [],
        updatedRelations: [],
      };

      console.log(`\n🚀 Executing afterUpdate() with unchanged status...`);
      await staffSubscriber.afterUpdate(mockUpdateEvent);

      const actualCalls = {
        handleStaffLeave:
          mockOpentalkStaffService.handleStaffLeave.mock.calls.length,
        handleNewStaff:
          mockOpentalkStaffService.handleNewStaff.mock.calls.length,
      };

      const verificationDetails = [
        `handleStaffLeave calls: ${actualCalls.handleStaffLeave} - Expected: 0`,
        `handleNewStaff calls: ${actualCalls.handleNewStaff} - Expected: 0`,
        'Status change check: ACTIVE → ACTIVE (no change detected)',
        'Schedule adjustment skipped due to unchanged status',
      ];

      const testResult = {
        success:
          actualCalls.handleStaffLeave === 0 &&
          actualCalls.handleNewStaff === 0,
        actualCalls,
        details: verificationDetails,
      };

      logTestResult(testResult);

      expect(mockOpentalkStaffService.handleStaffLeave).not.toHaveBeenCalled();
      expect(mockOpentalkStaffService.handleNewStaff).not.toHaveBeenCalled();
    });
  });
});
