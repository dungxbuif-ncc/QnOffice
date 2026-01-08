import {
  Cycle,
  OpentalkStaffService,
} from '../src/modules/schedule/services/opentalk-staff.schedule.service';

describe('OpentalkStaffService - Staff Onboarding/Offboarding', () => {
  const staffEmails = [
    'dung.buihuu@ncc.asia',
    'dung.phammanh@ncc.asia',
    'duy.huynhle@ncc.asia',
    'duy.nguyenxuan@ncc.asia',
    'du.levanky@ncc.asia',
    'dat.haquoc@ncc.asia',
    'hien.nguyenthanh@ncc.asia',
    'hoang.tranlehuy@ncc.asia',
  ];

  function hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  const staffIds = staffEmails.map((email) => hashStringToNumber(email));
  const holidays = new Set<string>();

  function logCycles(title: string, cycles: Cycle[]) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(title);
    console.log('='.repeat(60));
    cycles.forEach((cycle, idx) => {
      console.log(`\nCycle ${idx + 1} (ID: ${cycle.id})`);
      console.log(`  Period: ${cycle.startDate} → ${cycle.endDate}`);
      console.log(`  Events (${cycle.events.length}):`);
      cycle.events.forEach((event, eventIdx) => {
        const staffEmail =
          staffEmails[staffIds.indexOf(event.staffId)] || 'Unknown';
        console.log(
          `    [${eventIdx + 1}] Event #${event.id} | ${event.date} | Staff: ${staffEmail.split('@')[0]} (${event.staffId})`,
        );
      });
    });
    console.log('='.repeat(60));
  }

  describe('Staff Leave Scenarios', () => {
    it('Case 1: Staff leaves with upcoming event in current cycle - should shift remaining events', () => {
      const leavingStaffId = staffIds[2];
      const currentDate = '2026-02-01';

      const cycles: Cycle[] = [
        {
          id: 1,
          startDate: '2026-01-04',
          endDate: '2026-02-22',
          events: [
            { id: 1, date: '2026-01-04', staffId: staffIds[0] },
            { id: 2, date: '2026-01-11', staffId: staffIds[1] },
            { id: 3, date: '2026-01-18', staffId: leavingStaffId },
            { id: 4, date: '2026-01-25', staffId: staffIds[3] },
            { id: 5, date: '2026-02-01', staffId: staffIds[4] },
            { id: 6, date: '2026-02-08', staffId: leavingStaffId },
            { id: 7, date: '2026-02-15', staffId: staffIds[5] },
            { id: 8, date: '2026-02-22', staffId: staffIds[6] },
          ],
        },
      ];

      console.log(
        '\n📋 TEST CASE 1: Staff leaves with upcoming event in current cycle',
      );
      console.log(
        `Leaving Staff ID: ${leavingStaffId} (${staffEmails[2].split('@')[0]})`,
      );
      console.log(`Current Date: ${currentDate}`);

      logCycles('BEFORE - Staff Leave', cycles);

      const changes = OpentalkStaffService.calculateStaffLeaveChanges(
        cycles,
        leavingStaffId,
        currentDate,
        holidays,
      );

      console.log('\n📝 CALCULATED CHANGES:');
      console.log('Events to Update:', changes.eventsToUpdate);
      console.log('Participants to Delete:', changes.participantsToDelete);
      console.log('Events to Create:', changes.eventsToCreate);

      const after = OpentalkStaffService.applyChangesToCycles(cycles, changes);

      logCycles('AFTER - Staff Leave', after);

      expect(
        after[0].events.some(
          (e) => e.staffId === leavingStaffId && e.date >= currentDate,
        ),
      ).toBe(false);
      expect(changes.participantsToDelete.length).toBeGreaterThan(0);
      expect(changes.eventsToUpdate.length).toBeGreaterThan(0);
    });

    it('Case 2: Staff leaves with only past events - nothing should change', () => {
      const leavingStaffId = staffIds[2];
      const currentDate = '2026-03-01';

      const cycles: Cycle[] = [
        {
          id: 1,
          startDate: '2026-01-04',
          endDate: '2026-02-22',
          events: [
            { id: 1, date: '2026-01-04', staffId: staffIds[0] },
            { id: 2, date: '2026-01-11', staffId: staffIds[1] },
            { id: 3, date: '2026-01-18', staffId: leavingStaffId },
            { id: 4, date: '2026-01-25', staffId: staffIds[3] },
            { id: 5, date: '2026-02-01', staffId: staffIds[4] },
            { id: 6, date: '2026-02-08', staffId: staffIds[5] },
            { id: 7, date: '2026-02-15', staffId: staffIds[6] },
            { id: 8, date: '2026-02-22', staffId: staffIds[7] },
          ],
        },
      ];

      console.log('\n📋 TEST CASE 2: Staff leaves with only past events');
      console.log(
        `Leaving Staff ID: ${leavingStaffId} (${staffEmails[2].split('@')[0]})`,
      );
      console.log(`Current Date: ${currentDate}`);

      logCycles('BEFORE - Staff Leave', cycles);

      const changes = OpentalkStaffService.calculateStaffLeaveChanges(
        cycles,
        leavingStaffId,
        currentDate,
        holidays,
      );

      console.log('\n📝 CALCULATED CHANGES:');
      console.log('Events to Update:', changes.eventsToUpdate);
      console.log('Participants to Delete:', changes.participantsToDelete);
      console.log('Events to Create:', changes.eventsToCreate);

      const after = OpentalkStaffService.applyChangesToCycles(cycles, changes);

      logCycles('AFTER - Staff Leave', after);

      expect(changes.eventsToUpdate.length).toBe(0);
      expect(changes.participantsToDelete.length).toBe(0);
      expect(after[0].events.length).toBe(cycles[0].events.length);
    });

    it('Case 3: Staff leaves with events in middle of next cycle - should shift only in that cycle', () => {
      const leavingStaffId = staffIds[3];
      const currentDate = '2026-03-01';

      const cycles: Cycle[] = [
        {
          id: 1,
          startDate: '2026-01-04',
          endDate: '2026-02-22',
          events: [
            { id: 1, date: '2026-01-04', staffId: staffIds[0] },
            { id: 2, date: '2026-01-11', staffId: staffIds[1] },
            { id: 3, date: '2026-01-18', staffId: staffIds[2] },
            { id: 4, date: '2026-01-25', staffId: leavingStaffId },
            { id: 5, date: '2026-02-01', staffId: staffIds[4] },
            { id: 6, date: '2026-02-08', staffId: staffIds[5] },
            { id: 7, date: '2026-02-15', staffId: staffIds[6] },
            { id: 8, date: '2026-02-22', staffId: staffIds[7] },
          ],
        },
        {
          id: 2,
          startDate: '2026-03-01',
          endDate: '2026-04-19',
          events: [
            { id: 9, date: '2026-03-01', staffId: staffIds[0] },
            { id: 10, date: '2026-03-08', staffId: staffIds[1] },
            { id: 11, date: '2026-03-15', staffId: leavingStaffId },
            { id: 12, date: '2026-03-22', staffId: staffIds[4] },
            { id: 13, date: '2026-03-29', staffId: staffIds[5] },
            { id: 14, date: '2026-04-05', staffId: staffIds[6] },
            { id: 15, date: '2026-04-12', staffId: staffIds[7] },
            { id: 16, date: '2026-04-19', staffId: staffIds[2] },
          ],
        },
      ];

      console.log(
        '\n📋 TEST CASE 3: Staff leaves with events in middle of next cycle',
      );
      console.log(
        `Leaving Staff ID: ${leavingStaffId} (${staffEmails[3].split('@')[0]})`,
      );
      console.log(`Current Date: ${currentDate}`);

      logCycles('BEFORE - Staff Leave', cycles);

      const changes = OpentalkStaffService.calculateStaffLeaveChanges(
        cycles,
        leavingStaffId,
        currentDate,
        holidays,
      );

      console.log('\n📝 CALCULATED CHANGES:');
      console.log('Events to Update:', changes.eventsToUpdate);
      console.log('Participants to Delete:', changes.participantsToDelete);
      console.log('Events to Create:', changes.eventsToCreate);

      const after = OpentalkStaffService.applyChangesToCycles(cycles, changes);

      logCycles('AFTER - Staff Leave', after);

      const cycle2After = after.find((c) => c.id === 2);
      expect(
        cycle2After?.events.some((e) => e.staffId === leavingStaffId),
      ).toBe(false);
      expect(changes.participantsToDelete.some((d) => d.eventId === 11)).toBe(
        true,
      );
    });
  });

  describe('New Staff Onboarding Scenarios', () => {
    it('Case 4: New staff onboard - single cycle - should add to end', () => {
      const newStaffId = staffIds[7];

      const cycles: Cycle[] = [
        {
          id: 1,
          startDate: '2026-01-04',
          endDate: '2026-02-15',
          events: [
            { id: 1, date: '2026-01-04', staffId: staffIds[0] },
            { id: 2, date: '2026-01-11', staffId: staffIds[1] },
            { id: 3, date: '2026-01-18', staffId: staffIds[2] },
            { id: 4, date: '2026-01-25', staffId: staffIds[3] },
            { id: 5, date: '2026-02-01', staffId: staffIds[4] },
            { id: 6, date: '2026-02-08', staffId: staffIds[5] },
            { id: 7, date: '2026-02-15', staffId: staffIds[6] },
          ],
        },
      ];

      console.log('\n📋 TEST CASE 4: New staff onboard - single cycle');
      console.log(
        `New Staff ID: ${newStaffId} (${staffEmails[7].split('@')[0]})`,
      );

      logCycles('BEFORE - New Staff Onboard', cycles);

      const changes = OpentalkStaffService.calculateNewStaffChanges(
        cycles,
        newStaffId,
        holidays,
      );

      console.log('\n📝 CALCULATED CHANGES:');
      console.log('Events to Create:', changes.eventsToCreate);
      console.log('Events to Update:', changes.eventsToUpdate);
      console.log('Participants to Delete:', changes.participantsToDelete);

      const after = OpentalkStaffService.applyChangesToCycles(cycles, changes);

      logCycles('AFTER - New Staff Onboard', after);

      expect(changes.eventsToCreate.length).toBe(1);
      expect(changes.eventsToCreate[0].staffId).toBe(newStaffId);
      expect(changes.eventsToCreate[0].date).toBe('2026-02-22');
      expect(after[0].events[after[0].events.length - 1].staffId).toBe(
        newStaffId,
      );
    });

    it('Case 5: New staff onboard - multiple cycles - should shift next cycle if overlap', () => {
      const newStaffId = staffIds[7];

      const cycles: Cycle[] = [
        {
          id: 1,
          startDate: '2026-01-04',
          endDate: '2026-02-15',
          events: [
            { id: 1, date: '2026-01-04', staffId: staffIds[0] },
            { id: 2, date: '2026-01-11', staffId: staffIds[1] },
            { id: 3, date: '2026-01-18', staffId: staffIds[2] },
            { id: 4, date: '2026-01-25', staffId: staffIds[3] },
            { id: 5, date: '2026-02-01', staffId: staffIds[4] },
            { id: 6, date: '2026-02-08', staffId: staffIds[5] },
            { id: 7, date: '2026-02-15', staffId: staffIds[6] },
          ],
        },
        {
          id: 2,
          startDate: '2026-02-22',
          endDate: '2026-04-12',
          events: [
            { id: 8, date: '2026-02-22', staffId: staffIds[0] },
            { id: 9, date: '2026-03-01', staffId: staffIds[1] },
            { id: 10, date: '2026-03-08', staffId: staffIds[2] },
            { id: 11, date: '2026-03-15', staffId: staffIds[3] },
            { id: 12, date: '2026-03-22', staffId: staffIds[4] },
            { id: 13, date: '2026-03-29', staffId: staffIds[5] },
            { id: 14, date: '2026-04-05', staffId: staffIds[6] },
            { id: 15, date: '2026-04-12', staffId: staffIds[1] },
          ],
        },
      ];

      console.log(
        '\n📋 TEST CASE 5: New staff onboard - multiple cycles with overlap',
      );
      console.log(
        `New Staff ID: ${newStaffId} (${staffEmails[7].split('@')[0]})`,
      );

      logCycles('BEFORE - New Staff Onboard', cycles);

      const changes = OpentalkStaffService.calculateNewStaffChanges(
        cycles,
        newStaffId,
        holidays,
      );

      console.log('\n📝 CALCULATED CHANGES:');
      console.log('Events to Create:', changes.eventsToCreate);
      console.log('Events to Update:', changes.eventsToUpdate);
      console.log('Participants to Delete:', changes.participantsToDelete);

      const after = OpentalkStaffService.applyChangesToCycles(cycles, changes);

      logCycles('AFTER - New Staff Onboard', after);

      expect(changes.eventsToCreate.length).toBeGreaterThan(0);
      expect(changes.eventsToUpdate.length).toBeGreaterThan(0);
      expect(after[1].events[0].date).not.toBe('2026-02-22');
    });

    it('Case 6: New staff onboard - multiple cycles no overlap - should not shift next cycle', () => {
      const newStaffId = staffIds[7];

      const cycles: Cycle[] = [
        {
          id: 1,
          startDate: '2026-01-04',
          endDate: '2026-02-01',
          events: [
            { id: 1, date: '2026-01-04', staffId: staffIds[0] },
            { id: 2, date: '2026-01-11', staffId: staffIds[1] },
            { id: 3, date: '2026-01-18', staffId: staffIds[2] },
            { id: 4, date: '2026-01-25', staffId: staffIds[3] },
            { id: 5, date: '2026-02-01', staffId: staffIds[4] },
          ],
        },
        {
          id: 2,
          startDate: '2026-03-01',
          endDate: '2026-04-19',
          events: [
            { id: 6, date: '2026-03-01', staffId: staffIds[0] },
            { id: 7, date: '2026-03-08', staffId: staffIds[1] },
            { id: 8, date: '2026-03-15', staffId: staffIds[2] },
            { id: 9, date: '2026-03-22', staffId: staffIds[3] },
            { id: 10, date: '2026-03-29', staffId: staffIds[4] },
            { id: 11, date: '2026-04-05', staffId: staffIds[5] },
            { id: 12, date: '2026-04-12', staffId: staffIds[6] },
            { id: 13, date: '2026-04-19', staffId: staffIds[1] },
          ],
        },
      ];

      console.log(
        '\n📋 TEST CASE 6: New staff onboard - multiple cycles without overlap',
      );
      console.log(
        `New Staff ID: ${newStaffId} (${staffEmails[7].split('@')[0]})`,
      );

      logCycles('BEFORE - New Staff Onboard', cycles);

      const changes = OpentalkStaffService.calculateNewStaffChanges(
        cycles,
        newStaffId,
        holidays,
      );

      console.log('\n📝 CALCULATED CHANGES:');
      console.log('Events to Create:', changes.eventsToCreate);
      console.log('Events to Update:', changes.eventsToUpdate);
      console.log('Participants to Delete:', changes.participantsToDelete);

      const after = OpentalkStaffService.applyChangesToCycles(cycles, changes);

      logCycles('AFTER - New Staff Onboard', after);

      expect(changes.eventsToCreate.length).toBe(2);
      expect(changes.eventsToUpdate.length).toBe(0);
      expect(after[0].events[after[0].events.length - 1].staffId).toBe(
        newStaffId,
      );
      expect(after[1].events[after[1].events.length - 1].staffId).toBe(
        newStaffId,
      );
    });
  });

  describe('Data Integrity Tests', () => {
    it('Should not mutate original cycles when calculating changes', () => {
      const newStaffId = staffIds[7];
      const cycles: Cycle[] = [
        {
          id: 1,
          startDate: '2026-01-04',
          endDate: '2026-02-15',
          events: [
            { id: 1, date: '2026-01-04', staffId: staffIds[0] },
            { id: 2, date: '2026-01-11', staffId: staffIds[1] },
            { id: 3, date: '2026-01-18', staffId: staffIds[2] },
          ],
        },
      ];

      const originalEventsCount = cycles[0].events.length;
      const originalEndDate = cycles[0].endDate;

      const changes = OpentalkStaffService.calculateNewStaffChanges(
        cycles,
        newStaffId,
        holidays,
      );

      const after = OpentalkStaffService.applyChangesToCycles(cycles, changes);

      expect(cycles[0].events.length).toBe(originalEventsCount);
      expect(cycles[0].endDate).toBe(originalEndDate);
      expect(after[0].events.length).toBe(originalEventsCount + 1);
    });
  });
});
