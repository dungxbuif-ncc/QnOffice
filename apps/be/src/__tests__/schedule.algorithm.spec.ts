import {
  CycleData,
  SchedulerConfig,
  ScheduleType,
  SchedulingAlgorithm,
  Staff,
} from '../modules/schedule/schedule.algorith';

describe('SchedulingAlgorithm', () => {
  const staffEmails = [
    'dung.buihuu@ncc.asia',
    'dung.phammanh@ncc.asia',
    'duy.huynhle@ncc.asia',
    'duy.nguyenxuan@ncc.asia',
    'du.levanky@ncc.asia',
    'dat.haquoc@ncc.asia',
    'hien.nguyenthanh@ncc.asia',
    'hoang.tranlehuy@ncc.asia',
    'ho.nguyenphi@ncc.asia',
    'huy.trannam@ncc.asia',
    'huong.nguyenthithanh@ncc.asia',
    'kien.trinhduy@ncc.asia',
    'lich.duongthanh@ncc.asia',
    'loi.huynhphuc@ncc.asia',
    'minh.dovan@ncc.asia',
    'ngan.tonthuy@ncc.asia',
    'nguyen.nguyenphuoc@ncc.asia',
    'phu.nguyenthien@ncc.asia',
    'phuong.nguyenhonghang@ncc.asia',
    'quang.tranduong@ncc.asia',
    'son.cuhoangnguyen@ncc.asia',
    'tam.daonhon@ncc.asia',
    'thang.thieuquang@ncc.asia',
    'thuan.nguyenleanh@ncc.asia',
    'tien.caothicam@ncc.asia',
    'tien.nguyenvan@ncc.asia',
    'trinh.truongthiphuong@ncc.asia',
    'tuan.nguyentrong@ncc.asia',
  ];

  // Convert emails to staff objects with hash-based IDs for consistency
  function createStaffList(emails: string[]): Staff[] {
    return emails.map((email) => ({
      id: hashStringToNumber(email),
      username: email.split('@')[0],
    }));
  }

  // Simple hash function to convert email to consistent numeric ID
  function hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  const allStaff = createStaffList(staffEmails);

  describe('generateNewCycle - OPENTALK Schedule', () => {
    const opentalkConfig: SchedulerConfig = {
      type: ScheduleType.OPENTALK,
      startDate: new Date('2026-01-11'), // Saturday
      slotSize: 1,
      holidays: [],
    };

    it('should generate schedule for all staff with 1 person per slot (OPENTALK)', () => {
      const schedule = SchedulingAlgorithm.generateNewCycle(
        allStaff,
        null,
        opentalkConfig,
      );

      expect(schedule).toHaveLength(28); // All staff should get assigned

      // Each event should have exactly 1 participant
      schedule.forEach((event) => {
        expect(event.staffIds).toHaveLength(1);
      });

      // All events should be on Saturdays
      schedule.forEach((event) => {
        expect(event.date.getDay()).toBe(6); // Saturday = 6
      });

      // All staff should be assigned exactly once
      const assignedStaffIds = schedule.flatMap((event) => event.staffIds);
      expect(assignedStaffIds).toHaveLength(28);
      expect(new Set(assignedStaffIds).size).toBe(28); // No duplicates
    });

    it('should skip holidays when generating OPENTALK schedule', () => {
      const configWithHolidays: SchedulerConfig = {
        ...opentalkConfig,
        holidays: [
          new Date('2026-01-18'), // Skip this Saturday
          new Date('2026-02-01'), // Skip this Saturday
        ],
      };

      const schedule = SchedulingAlgorithm.generateNewCycle(
        allStaff,
        null,
        configWithHolidays,
      );

      // Should skip holiday dates
      const eventDates = schedule.map((event) => event.date.toDateString());
      expect(eventDates).not.toContain('Sat Jan 18 2026');
      expect(eventDates).not.toContain('Sat Feb 01 2026');
    });

    it('should prioritize staff who did not work recently (fairness test)', () => {
      // Previous cycle where last 20% included specific staff
      const previousCycle: CycleData = {
        id: 1,
        events: [
          { date: new Date('2025-12-07'), staffIds: [allStaff[0].id] },
          { date: new Date('2025-12-14'), staffIds: [allStaff[1].id] },
          { date: new Date('2025-12-21'), staffIds: [allStaff[2].id] },
          { date: new Date('2025-12-28'), staffIds: [allStaff[3].id] }, // Recent (last 20%)
          { date: new Date('2026-01-04'), staffIds: [allStaff[4].id] }, // Recent (last 20%)
        ],
      };

      const schedule = SchedulingAlgorithm.generateNewCycle(
        allStaff,
        previousCycle,
        opentalkConfig,
      );

      // First few assignments should not be the recent staff
      const firstFiveAssignments = schedule
        .slice(0, 5)
        .flatMap((e) => e.staffIds);
      expect(firstFiveAssignments).not.toContain(allStaff[3].id); // Should be deprioritized
      expect(firstFiveAssignments).not.toContain(allStaff[4].id); // Should be deprioritized
    });

    it('should shuffle staff order for randomness while maintaining fairness', () => {
      // Run the algorithm multiple times with same input
      const schedule1 = SchedulingAlgorithm.generateNewCycle(
        allStaff,
        null,
        opentalkConfig,
      );
      const schedule2 = SchedulingAlgorithm.generateNewCycle(
        allStaff,
        null,
        opentalkConfig,
      );
      const schedule3 = SchedulingAlgorithm.generateNewCycle(
        allStaff,
        null,
        opentalkConfig,
      );

      // Orders might be different due to shuffling
      const order1 = schedule1.map((e) => e.staffIds[0]);
      const order2 = schedule2.map((e) => e.staffIds[0]);
      const order3 = schedule3.map((e) => e.staffIds[0]);

      // Should have some variation (not always identical)
      const allOrdersIdentical =
        JSON.stringify(order1) === JSON.stringify(order2) &&
        JSON.stringify(order2) === JSON.stringify(order3);

      // With 28 staff, the chance of identical orders is extremely low
      expect(allOrdersIdentical).toBe(false);

      // But all should contain the same staff
      expect(new Set(order1)).toEqual(new Set(order2));
      expect(new Set(order2)).toEqual(new Set(order3));
    });
  });

  describe('generateNewCycle - CLEANING Schedule', () => {
    const cleaningConfig: SchedulerConfig = {
      type: ScheduleType.CLEANING,
      startDate: new Date('2026-01-06'), // Monday
      slotSize: 2,
      holidays: [],
    };

    it('should generate schedule with 2 people per slot (CLEANING)', () => {
      const schedule = SchedulingAlgorithm.generateNewCycle(
        allStaff,
        null,
        cleaningConfig,
      );

      expect(schedule).toHaveLength(14); // 28 staff / 2 per slot = 14 events

      // Each event should have exactly 2 participants
      schedule.forEach((event) => {
        expect(event.staffIds).toHaveLength(2);
      });

      // All events should be on weekdays (Mon-Fri)
      schedule.forEach((event) => {
        const dayOfWeek = event.date.getDay();
        expect(dayOfWeek).toBeGreaterThanOrEqual(1); // Monday = 1
        expect(dayOfWeek).toBeLessThanOrEqual(5); // Friday = 5
      });
    });

    it('should skip weekends when generating CLEANING schedule', () => {
      const schedule = SchedulingAlgorithm.generateNewCycle(
        allStaff,
        null,
        cleaningConfig,
      );

      // No events should be on weekends
      schedule.forEach((event) => {
        const dayOfWeek = event.date.getDay();
        expect(dayOfWeek).not.toBe(0); // Not Sunday
        expect(dayOfWeek).not.toBe(6); // Not Saturday
      });
    });

    it('should handle odd number of staff gracefully', () => {
      const oddStaff = allStaff.slice(0, 15); // 15 staff

      const schedule = SchedulingAlgorithm.generateNewCycle(
        oddStaff,
        null,
        cleaningConfig,
      );

      expect(schedule).toHaveLength(8); // 7 full pairs + 1 single

      // First 7 events should have 2 people
      schedule.slice(0, 7).forEach((event) => {
        expect(event.staffIds).toHaveLength(2);
      });

      // Last event should have 1 person (the remaining one)
      expect(schedule[7].staffIds).toHaveLength(1);
    });

    it('should maintain fairness across multiple pairs', () => {
      // Test that staff are paired fairly, not always the same combinations
      const schedule1 = SchedulingAlgorithm.generateNewCycle(
        allStaff,
        null,
        cleaningConfig,
      );
      const schedule2 = SchedulingAlgorithm.generateNewCycle(
        allStaff,
        null,
        cleaningConfig,
      );

      // Extract all unique pairs from both schedules
      const pairs1 = schedule1.map((e) => e.staffIds.sort().join(','));
      const pairs2 = schedule2.map((e) => e.staffIds.sort().join(','));

      // Should have some variation in pairing due to shuffling
      const identicalPairs = pairs1.filter(
        (pair, index) => pair === pairs2[index],
      ).length;
      expect(identicalPairs).toBeLessThan(14); // Not all pairs should be identical
    });
  });

  describe('shiftSchedule', () => {
    it('should shift schedule when staff is removed (OPENTALK)', () => {
      const originalEvents = [
        { date: new Date('2026-01-11'), staffIds: [allStaff[0].id] },
        { date: new Date('2026-01-18'), staffIds: [allStaff[1].id] },
        { date: new Date('2026-01-25'), staffIds: [allStaff[2].id] },
        { date: new Date('2026-02-01'), staffIds: [allStaff[3].id] },
      ];

      // Remove staff[1]
      const removedStaffIds = [allStaff[1].id];

      const shiftedSchedule = SchedulingAlgorithm.shiftSchedule(
        originalEvents,
        removedStaffIds,
        {
          type: ScheduleType.OPENTALK,
          startDate: new Date('2026-01-11'),
          slotSize: 1,
          holidays: [],
        },
      );

      expect(shiftedSchedule).toHaveLength(3); // One staff removed

      // Should not contain the removed staff
      const remainingStaffIds = shiftedSchedule.flatMap((e) => e.staffIds);
      expect(remainingStaffIds).not.toContain(allStaff[1].id);

      // Should contain other staff
      expect(remainingStaffIds).toContain(allStaff[0].id);
      expect(remainingStaffIds).toContain(allStaff[2].id);
      expect(remainingStaffIds).toContain(allStaff[3].id);
    });

    it('should shift schedule when staff is removed (CLEANING)', () => {
      const originalEvents = [
        {
          date: new Date('2026-01-06'),
          staffIds: [allStaff[0].id, allStaff[1].id],
        },
        {
          date: new Date('2026-01-07'),
          staffIds: [allStaff[2].id, allStaff[3].id],
        },
        {
          date: new Date('2026-01-08'),
          staffIds: [allStaff[4].id, allStaff[5].id],
        },
      ];

      // Remove staff[1] and staff[4]
      const removedStaffIds = [allStaff[1].id, allStaff[4].id];

      const shiftedSchedule = SchedulingAlgorithm.shiftSchedule(
        originalEvents,
        removedStaffIds,
        {
          type: ScheduleType.CLEANING,
          startDate: new Date('2026-01-06'),
          slotSize: 2,
          holidays: [],
        },
      );

      expect(shiftedSchedule).toHaveLength(2); // 4 remaining staff / 2 per slot = 2 events

      // Should not contain removed staff
      const remainingStaffIds = shiftedSchedule.flatMap((e) => e.staffIds);
      expect(remainingStaffIds).not.toContain(allStaff[1].id);
      expect(remainingStaffIds).not.toContain(allStaff[4].id);

      // Should contain other staff in correct order
      expect(remainingStaffIds).toEqual([
        allStaff[0].id,
        allStaff[2].id,
        allStaff[3].id,
        allStaff[5].id,
      ]);
    });

    it('should return empty array when all events are empty', () => {
      const shiftedSchedule = SchedulingAlgorithm.shiftSchedule([], [], {
        type: ScheduleType.OPENTALK,
        startDate: new Date('2026-01-11'),
        slotSize: 1,
        holidays: [],
      });

      expect(shiftedSchedule).toEqual([]);
    });
  });

  describe('Edge Cases and Constraints', () => {
    it('should handle holidays properly for both schedule types', () => {
      const holidays = [
        new Date('2026-01-06'), // Monday
        new Date('2026-01-11'), // Saturday
        new Date('2026-01-13'), // Monday
      ];

      // CLEANING: Should skip Monday holidays
      const cleaningSchedule = SchedulingAlgorithm.generateNewCycle(
        allStaff.slice(0, 4), // 4 staff for simpler test
        null,
        {
          type: ScheduleType.CLEANING,
          startDate: new Date('2026-01-06'),
          slotSize: 2,
          holidays,
        },
      );

      cleaningSchedule.forEach((event) => {
        const dateString = event.date.toDateString();
        expect(dateString).not.toBe(new Date('2026-01-06').toDateString());
        expect(dateString).not.toBe(new Date('2026-01-13').toDateString());
      });

      // OPENTALK: Should skip Saturday holidays
      const opentalkSchedule = SchedulingAlgorithm.generateNewCycle(
        allStaff.slice(0, 4), // 4 staff for simpler test
        null,
        {
          type: ScheduleType.OPENTALK,
          startDate: new Date('2026-01-11'),
          slotSize: 1,
          holidays,
        },
      );

      opentalkSchedule.forEach((event) => {
        const dateString = event.date.toDateString();
        expect(dateString).not.toBe(new Date('2026-01-11').toDateString());
      });
    });

    it('should ensure no staff duplication within a cycle', () => {
      const schedule = SchedulingAlgorithm.generateNewCycle(allStaff, null, {
        type: ScheduleType.OPENTALK,
        startDate: new Date('2026-01-11'),
        slotSize: 1,
        holidays: [],
      });

      const allAssignedIds = schedule.flatMap((e) => e.staffIds);
      const uniqueIds = new Set(allAssignedIds);

      expect(allAssignedIds.length).toBe(uniqueIds.size); // No duplicates
      expect(uniqueIds.size).toBe(allStaff.length); // All staff assigned
    });

    it('should maintain staff order consistency in shift operations', () => {
      const originalEvents = [
        { date: new Date('2026-01-11'), staffIds: [allStaff[0].id] },
        { date: new Date('2026-01-18'), staffIds: [allStaff[1].id] },
        { date: new Date('2026-01-25'), staffIds: [allStaff[2].id] },
        { date: new Date('2026-02-01'), staffIds: [allStaff[3].id] },
        { date: new Date('2026-02-08'), staffIds: [allStaff[4].id] },
      ];

      // Remove middle staff
      const shiftedSchedule = SchedulingAlgorithm.shiftSchedule(
        originalEvents,
        [allStaff[2].id], // Remove staff[2]
        {
          type: ScheduleType.OPENTALK,
          startDate: new Date('2026-01-11'),
          slotSize: 1,
          holidays: [],
        },
      );

      // Should maintain relative order of remaining staff
      const remainingIds = shiftedSchedule.map((e) => e.staffIds[0]);
      expect(remainingIds).toEqual([
        allStaff[0].id,
        allStaff[1].id,
        allStaff[3].id,
        allStaff[4].id,
      ]);
    });
  });

  describe('Fairness and Distribution Tests', () => {
    it('should distribute workload evenly over multiple cycles', () => {
      const shortStaffList = allStaff.slice(0, 6); // Use 6 staff for clearer testing

      // Generate 3 cycles
      let previousCycle: CycleData | null = null;
      const cycles: CycleData[] = [];

      for (let i = 0; i < 3; i++) {
        const schedule = SchedulingAlgorithm.generateNewCycle(
          shortStaffList,
          previousCycle,
          {
            type: ScheduleType.OPENTALK,
            startDate: new Date(`2026-0${i + 1}-11`),
            slotSize: 1,
            holidays: [],
          },
        );

        const cycle: CycleData = {
          id: i + 1,
          events: schedule,
        };

        cycles.push(cycle);
        previousCycle = cycle;
      }

      // Count total assignments per staff across all cycles
      const assignmentCounts: Record<number, number> = {};
      shortStaffList.forEach((staff) => {
        assignmentCounts[staff.id] = 0;
      });

      cycles.forEach((cycle) => {
        cycle.events.forEach((event) => {
          event.staffIds.forEach((staffId) => {
            assignmentCounts[staffId]++;
          });
        });
      });

      // Each staff should have worked exactly 3 times (once per cycle)
      Object.values(assignmentCounts).forEach((count) => {
        expect(count).toBe(3);
      });
    });

    it('should ensure recent workers are deprioritized consistently', () => {
      const testStaff = allStaff.slice(0, 10);

      // Create previous cycle where last 2 events (20% of 10) had specific staff
      const previousCycle: CycleData = {
        id: 1,
        events: [
          { date: new Date('2025-12-07'), staffIds: [testStaff[0].id] },
          { date: new Date('2025-12-14'), staffIds: [testStaff[1].id] },
          { date: new Date('2025-12-21'), staffIds: [testStaff[2].id] },
          { date: new Date('2025-12-28'), staffIds: [testStaff[3].id] },
          { date: new Date('2026-01-04'), staffIds: [testStaff[4].id] },
          { date: new Date('2026-01-11'), staffIds: [testStaff[5].id] },
          { date: new Date('2026-01-18'), staffIds: [testStaff[6].id] },
          { date: new Date('2026-01-25'), staffIds: [testStaff[7].id] },
          { date: new Date('2026-02-01'), staffIds: [testStaff[8].id] }, // Recent (last 20%)
          { date: new Date('2026-02-08'), staffIds: [testStaff[9].id] }, // Recent (last 20%)
        ],
      };

      const newSchedule = SchedulingAlgorithm.generateNewCycle(
        testStaff,
        previousCycle,
        {
          type: ScheduleType.OPENTALK,
          startDate: new Date('2026-02-15'),
          slotSize: 1,
          holidays: [],
        },
      );

      // The recently assigned staff (testStaff[8] and testStaff[9]) should appear later
      const assignmentOrder = newSchedule.map((e) => e.staffIds[0]);
      const recentStaff1Position = assignmentOrder.indexOf(testStaff[8].id);
      const recentStaff2Position = assignmentOrder.indexOf(testStaff[9].id);

      // Recent staff should not be in the first half of assignments
      expect(recentStaff1Position).toBeGreaterThan(4); // Not in first 5 positions
      expect(recentStaff2Position).toBeGreaterThan(4); // Not in first 5 positions
    });
  });
});
