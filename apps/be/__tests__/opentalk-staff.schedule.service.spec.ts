
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as util from 'util';
import HolidayEntity from '../src/modules/holiday/holiday.entity';
import ScheduleEventParticipantEntity from '../src/modules/schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '../src/modules/schedule/enties/schedule-event.entity';
import { OpentalkStaffService } from '../src/modules/schedule/services/opentalk-staff.schedule.service';
import StaffEntity from '../src/modules/staff/staff.entity';

// --- Constants ---
export const STAFF_1 = { id: 1, email: 'staff1@example.com' } as unknown as StaffEntity;
export const STAFF_2 = { id: 2, email: 'staff2@example.com' } as unknown as StaffEntity;
export const STAFF_3 = { id: 3, email: 'staff3@example.com' } as unknown as StaffEntity;
export const STAFF_4 = { id: 4, email: 'staff4@example.com' } as unknown as StaffEntity;
export const STAFF_5 = { id: 5, email: 'staff5@example.com' } as unknown as StaffEntity;
export const NEW_STAFF = { id: 99, email: 'new@example.com' } as unknown as StaffEntity;

// --- Test Logger Helper ---
class TestLogger {
  static caseStart(name: string, mockDate: string) {
    process.stdout.write(`\n\x1b[33m=================================================================================\x1b[0m\n`);
    process.stdout.write(`\x1b[33m TEST CASE: ${name} \x1b[0m\n`);
    process.stdout.write(`\x1b[36m MOCK DATE: ${mockDate} \x1b[0m\n`);
    process.stdout.write(`\x1b[33m=================================================================================\x1b[0m\n`);
  }

  static info(label: string, value: any) {
    let valStr = '';
    if (typeof value === 'object' && value !== null) {
        if ('id' in value && 'email' in value) {
             valStr = `id: ${value.id} - '${value.email}'`;
        } else {
             valStr = util.inspect(value, { compact: true, colors: true, breakLength: Infinity });
        }
    } else {
        valStr = String(value);
    }
    process.stdout.write(`- ${label}: ${valStr}\n`);
  }

  static table(title: string, events: any[], highlightIds: number[] = [], currentDate?: string) {
      process.stdout.write(`\n${title}\n`);
      if (!events || events.length === 0) {
          process.stdout.write("  (No events)\n\n");
          return;
      }
      
      const fmt = (str: string, len: number) => str.padEnd(len);
      const getDayName = (dateStr: string) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', { weekday: 'short' });
      };

      const getStatus = (dateStr: string) => {
          if (!currentDate || !dateStr) return '';
          return dateStr < currentDate ? 'PAST' : (dateStr === currentDate ? 'TODAY' : 'FUTURE');
      };

      // Group events by CycleID
      const eventsByCycle: { [key: string]: any[] } = {};
      events.forEach(e => {
          const cId = String(e.cycleId ?? '?');
          if (!eventsByCycle[cId]) eventsByCycle[cId] = [];
          eventsByCycle[cId].push(e);
      });

      Object.keys(eventsByCycle).forEach(cycleId => {
          process.stdout.write(`  [Cycle ID: ${cycleId}]\n`);
          process.stdout.write(`  ┌──────────┬──────────┬────────────────────┬──────────┬──────────┐\n`);
          process.stdout.write(`  │ ${fmt('EventID', 8)} │ ${fmt('StaffID', 8)} │ ${fmt('Date', 18)} │ ${fmt('CycleID', 8)} │ ${fmt('Status', 8)} │\n`);
          process.stdout.write(`  ├──────────┼──────────┼────────────────────┼──────────┼──────────┤\n`);
          
          eventsByCycle[cycleId].forEach(e => {
            const isHighlighted = highlightIds.includes(e.id);
            const marker = isHighlighted ? ' >>' : '   '; 
            const idStr = String(e.id ?? -1);
            
            const id = fmt(idStr, 8);
            const staffId = fmt(String(e.staffId ?? e.eventParticipants?.[0]?.staffId ?? '?'), 8);
            const rawDate = (e.date || e.eventDate || '');
            const dateStr = rawDate ? `${rawDate} (${getDayName(rawDate)})` : '';
            const date = fmt(dateStr, 18);
            const cId = fmt(String(e.cycleId ?? '?'), 8);
            const status = fmt(getStatus(rawDate), 8);

            const rowContent = `│ ${id} │ ${staffId} │ ${date} │ ${cId} │ ${status} │${marker}`;
            if (isHighlighted) {
                process.stdout.write(`  \x1b[32m${rowContent}\x1b[0m\n`); 
            } else {
                process.stdout.write(`  ${rowContent}\n`);
            }
          });
          process.stdout.write(`  └──────────┴──────────┴────────────────────┴──────────┴──────────┘\n`);
          process.stdout.write('\n');
      });
  }

  static assertion(msg: string) {
      process.stdout.write(`✅ ${msg}\n`);
  }
}

// --- Mocks ---
const mockEventRepository = {
  find: jest.fn(),
  create: jest.fn((entity) => entity),
  save: jest.fn((entity) => Promise.resolve({ ...entity, id: Math.floor(Math.random() * 1000) + 1000 })),
  update: jest.fn(),
};

const mockParticipantRepository = {
  save: jest.fn(),
  delete: jest.fn(),
};

const mockHolidayRepository = {
  find: jest.fn(),
};

describe('OpentalkStaffService', () => {
  let service: OpentalkStaffService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpentalkStaffService,
        {
          provide: getRepositoryToken(ScheduleEventEntity),
          useValue: mockEventRepository,
        },
        {
          provide: getRepositoryToken(ScheduleEventParticipantEntity),
          useValue: mockParticipantRepository,
        },
        {
          provide: getRepositoryToken(HolidayEntity),
          useValue: mockHolidayRepository,
        },
      ],
    }).compile();

    service = module.get<OpentalkStaffService>(OpentalkStaffService);
    jest.clearAllMocks();
  });

  describe('handleStaffLeave', () => {

    it('Case 1: Single Cycle - Staff LEAVED (Future) - Events shift filling the gap', async () => {
      const currentDate = '2024-01-01'; // Monday
      TestLogger.caseStart('Case 1: Single Cycle (Future)', currentDate);
      jest.useFakeTimers().setSystemTime(new Date(currentDate + 'T12:00:00Z'));

      // Cycle 1: [Jan 06, Jan 13, Jan 20, Jan 27, Feb 03]
      // Action: S3 (Jan 20) LEAVES.
      const initialCyclesMock = [
        { cycleId: 1, id: 101, eventDate: '2024-01-06', eventParticipants: [{ staffId: 1 }] },
        { cycleId: 1, id: 102, eventDate: '2024-01-13', eventParticipants: [{ staffId: 2 }] },
        { cycleId: 1, id: 103, eventDate: '2024-01-20', eventParticipants: [{ staffId: 3 }] }, // LEAVES
        { cycleId: 1, id: 104, eventDate: '2024-01-27', eventParticipants: [{ staffId: 4 }] },
        { cycleId: 1, id: 105, eventDate: '2024-02-03', eventParticipants: [{ staffId: 5 }] }
      ] as any[];

      mockEventRepository.find.mockResolvedValue(initialCyclesMock);
      mockHolidayRepository.find.mockResolvedValue([]);

      TestLogger.info('Action', 'Staff 3 leaves (Jan 20). Future events should shift left.');
      TestLogger.table('[BEFORE]', initialCyclesMock, [], currentDate);

      const result = await service.handleStaffLeave(STAFF_3);
      const allEvents = result.after.flatMap(c => c.events.map(e => ({ ...e, cycleId: c.id })));
      TestLogger.table('[AFTER]', allEvents, [104, 105], currentDate);

      expect(allEvents.find(e => e.staffId === 3)).toBeUndefined();
      expect(allEvents.find(e => e.staffId === 4)?.date).toBe('2024-01-20');
      expect(allEvents.find(e => e.staffId === 5)?.date).toBe('2024-01-27');
      TestLogger.assertion('Verified: S4->Jan 20, S5->Jan 27.');
    });

    it('Case 2: Single Cycle - Staff LEAVED (Mixed Past) - No Change', async () => {
      const currentDate = '2024-01-15'; // Monday
      TestLogger.caseStart('Case 2: Single Cycle (Mixed Past)', currentDate);
      jest.useFakeTimers().setSystemTime(new Date(currentDate + 'T12:00:00Z'));

      // Cycle: [Jan 06(Past), Jan 13(Past), Jan 20(Future), Jan 27(Future), Feb 03(Future)]
      // Action: S2 (Jan 13 - PAST) LEAVES.
      const initialCyclesMock = [
        { cycleId: 1, id: 201, eventDate: '2024-01-06', eventParticipants: [{ staffId: 1 }] },
        { cycleId: 1, id: 202, eventDate: '2024-01-13', eventParticipants: [{ staffId: 2 }] }, // LEAVES (Past)
        { cycleId: 1, id: 203, eventDate: '2024-01-20', eventParticipants: [{ staffId: 3 }] },
        { cycleId: 1, id: 204, eventDate: '2024-01-27', eventParticipants: [{ staffId: 4 }] },
        { cycleId: 1, id: 205, eventDate: '2024-02-03', eventParticipants: [{ staffId: 5 }] }
      ] as any[];

      mockEventRepository.find.mockResolvedValue(initialCyclesMock);
      mockHolidayRepository.find.mockResolvedValue([]);

      TestLogger.info('Action', 'Staff 2 leaves (Jan 13 - PAST).');
      TestLogger.table('[BEFORE]', initialCyclesMock, [], currentDate);
      
      const result = await service.handleStaffLeave(STAFF_2);
      const allEvents = result.after.flatMap(c => c.events.map(e => ({ ...e, cycleId: c.id })));
      TestLogger.table('[AFTER]', allEvents, [], currentDate);

      expect(allEvents.find(e => e.staffId === 2)).toBeDefined();
      expect(allEvents.find(e => e.staffId === 2)?.date).toBe('2024-01-13');
      TestLogger.assertion('Verified: No changes, history preserved.');
    });

    it('Case 3: Multi Cycle - Leave Future (Overlap Check)', async () => {
      const currentDate = '2024-01-01';
      TestLogger.caseStart('Case 3: Multi Cycle - Overlap Check', currentDate);
      jest.useFakeTimers().setSystemTime(new Date(currentDate + 'T12:00:00Z'));

      // C1 Ends Feb 03.
      // C2 Starts Feb 17 (2 weeks later).
      // Action: S3 leaves C1.
      // C1 shrinks. New End: Jan 27.
      // Gap: Jan 27 -> Feb 17. Valid. C2 stays.
      
      const initialCyclesMock = [
        // C1
        { cycleId: 1, id: 301, eventDate: '2024-01-06', eventParticipants: [{ staffId: 1 }] },
        { cycleId: 1, id: 302, eventDate: '2024-01-13', eventParticipants: [{ staffId: 2 }] },
        { cycleId: 1, id: 303, eventDate: '2024-01-20', eventParticipants: [{ staffId: 3 }] }, // LEAVES
        { cycleId: 1, id: 304, eventDate: '2024-01-27', eventParticipants: [{ staffId: 4 }] },
        { cycleId: 1, id: 305, eventDate: '2024-02-03', eventParticipants: [{ staffId: 5 }] },
        // C2
        { cycleId: 2, id: 306, eventDate: '2024-02-17', eventParticipants: [{ staffId: 1 }] },
        { cycleId: 2, id: 307, eventDate: '2024-02-24', eventParticipants: [{ staffId: 2 }] },
        { cycleId: 2, id: 308, eventDate: '2024-03-02', eventParticipants: [{ staffId: 3 }] },
        { cycleId: 2, id: 309, eventDate: '2024-03-09', eventParticipants: [{ staffId: 4 }] },
        { cycleId: 2, id: 310, eventDate: '2024-03-16', eventParticipants: [{ staffId: 5 }] }
      ] as any[];

      mockEventRepository.find.mockResolvedValue(initialCyclesMock);
      mockHolidayRepository.find.mockResolvedValue([]);

      TestLogger.table('[BEFORE]', initialCyclesMock, [303], currentDate);
      const result = await service.handleStaffLeave(STAFF_3);
      const allEvents = result.after.flatMap(c => c.events.map(e => ({ ...e, cycleId: c.id })));
      TestLogger.table('[AFTER]', allEvents, [304, 305], currentDate);

      const s5_c1 = allEvents.find(e => e.id === 305);
      const s1_c2 = allEvents.find(e => e.id === 306);

      expect(s5_c1?.date).toBe('2024-01-27');
      expect(s1_c2?.date).toBe('2024-02-03');
      TestLogger.assertion('Verified: C1 S5 shifted to Jan 27. C2 shifted to Feb 03 (Gap Closed).');
    });

    it('Case 5: Multi Cycle - Staff Leave (Both Cycles) - Correct Shifting', async () => {
      const currentDate = '2024-01-01';
      TestLogger.caseStart('Case 5: Multi Cycle - Leave Both Cycles', currentDate);
      jest.useFakeTimers().setSystemTime(new Date(currentDate + 'T12:00:00Z'));

      // Cycle 1: [Jan 06, Jan 13, Jan 20, Jan 27]
      // Cycle 2: [Feb 10, Feb 17, Feb 24, Mar 02] (Starts 2 weeks after C1 end)
      // Staff 3 leaves. (Jan 20 in C1, Feb 24 in C2)

      const initialCyclesMock = [
        // C1
        { cycleId: 1, id: 501, eventDate: '2024-01-06', eventParticipants: [{ staffId: 1 }] },
        { cycleId: 1, id: 502, eventDate: '2024-01-13', eventParticipants: [{ staffId: 2 }] },
        { cycleId: 1, id: 503, eventDate: '2024-01-20', eventParticipants: [{ staffId: 3 }] }, // LEAVES
        { cycleId: 1, id: 504, eventDate: '2024-01-27', eventParticipants: [{ staffId: 4 }] },
        // C2
        { cycleId: 2, id: 505, eventDate: '2024-02-10', eventParticipants: [{ staffId: 1 }] },
        { cycleId: 2, id: 506, eventDate: '2024-02-17', eventParticipants: [{ staffId: 2 }] },
        { cycleId: 2, id: 507, eventDate: '2024-02-24', eventParticipants: [{ staffId: 3 }] }, // LEAVES
        { cycleId: 2, id: 508, eventDate: '2024-03-02', eventParticipants: [{ staffId: 4 }] },
      ] as any[];

      mockEventRepository.find.mockResolvedValue(initialCyclesMock);
      mockHolidayRepository.find.mockResolvedValue([]);

      TestLogger.table('[BEFORE]', initialCyclesMock, [503, 507], currentDate);

      const result = await service.handleStaffLeave(STAFF_3);
      const allEvents = result.after.flatMap(c => c.events.map(e => ({ ...e, cycleId: c.id })));
      TestLogger.table('[AFTER]', allEvents, [], currentDate);

      // Verify C1
      // S3(503) removed. S4(504) should shift to Jan 20.
      const s4_c1 = allEvents.find(e => e.id === 504);
      expect(s4_c1?.date).toBe('2024-01-20');

      // Verify C2
      // Logic enforces continuity. C1 ends Jan 20. C2 should start Jan 27.
      // C2 Events originally: S1(Feb 10), S2(Feb 17), S3(Feb 24-Gone), S4(Mar 02)
      // Shifted C2: S1->Jan 27, S2->Feb 03, S4->Feb 10 (S3 removed)
      
      const s1_c2 = allEvents.find(e => e.id === 505);
      expect(s1_c2?.date).toBe('2024-01-27');

      const s2_c2 = allEvents.find(e => e.id === 506);
      expect(s2_c2?.date).toBe('2024-02-03');

      const s4_c2 = allEvents.find(e => e.id === 508);
      // S3(507) was Feb 24 (before shift).
      // Sequence: S1, S2, S4.
      // Dates: Jan 27, Feb 03, Feb 10.
      expect(s4_c2?.date).toBe('2024-02-10');

      TestLogger.assertion('Verified: Both cycles shifted & compacted. C1 gaps filled, C2 pulled back to follow C1.');
    });
  });

  describe('handleNewStaff', () => {
    it('Case 4: New Staff - Append (Overlap)', async () => {
      const currentDate = '2024-01-01';
      TestLogger.caseStart('Case 4: New Staff - Append (Overlap)', currentDate);
      jest.useFakeTimers().setSystemTime(new Date(currentDate + 'T12:00:00Z'));

      // C1: [Jan 6 ... Feb 3]
      // C2: Starts Feb 10 (Next week).
      // Action: Add New Staff to C1.
      // C1 New End: Feb 10.
      // Overlap with C2 Start (Feb 10).
      // C2 must shift -> Feb 17.

      const initialCyclesMock = [
        // C1
        { cycleId: 1, id: 401, eventDate: '2024-01-06', eventParticipants: [{ staffId: 1 }] },
        { cycleId: 1, id: 402, eventDate: '2024-01-13', eventParticipants: [{ staffId: 2 }] },
        { cycleId: 1, id: 403, eventDate: '2024-01-20', eventParticipants: [{ staffId: 3 }] },
        { cycleId: 1, id: 404, eventDate: '2024-01-27', eventParticipants: [{ staffId: 4 }] },
        { cycleId: 1, id: 405, eventDate: '2024-02-03', eventParticipants: [{ staffId: 5 }] },
        // C2
        { cycleId: 2, id: 406, eventDate: '2024-02-10', eventParticipants: [{ staffId: 1 }] },
        { cycleId: 2, id: 407, eventDate: '2024-02-17', eventParticipants: [{ staffId: 2 }] },
        { cycleId: 2, id: 408, eventDate: '2024-02-24', eventParticipants: [{ staffId: 3 }] },
        { cycleId: 2, id: 409, eventDate: '2024-03-02', eventParticipants: [{ staffId: 4 }] },
        { cycleId: 2, id: 410, eventDate: '2024-03-09', eventParticipants: [{ staffId: 5 }] }
      ] as any[];

      mockEventRepository.find.mockResolvedValue(initialCyclesMock);
      mockHolidayRepository.find.mockResolvedValue([]);
      mockEventRepository.save.mockImplementation(e => Promise.resolve({ ...e, id: 499 }));

      TestLogger.table('[BEFORE]', initialCyclesMock, [], currentDate);
      const result = await service.handleNewStaff(NEW_STAFF);
      const allEvents = result.after.flatMap(c => c.events.map(e => ({ ...e, cycleId: c.id })));
      TestLogger.table('[AFTER]', allEvents, [499, 406], currentDate);

      const newStaff = allEvents.find(e => e.staffId === 99);
      const s1_c2 = allEvents.find(e => e.id === 406);

      expect(newStaff?.date).toBe('2024-02-10');
      expect(s1_c2?.date).toBe('2024-02-17');
      TestLogger.assertion('Verified: New Staff -> Feb 10. C2 Shifted -> Feb 17.');
    });

    it('Case 6: New Staff - Append (No Overlap)', async () => {
      const currentDate = '2024-01-01';
      TestLogger.caseStart('Case 6: New Staff - Append (No Overlap)', currentDate);
      jest.useFakeTimers().setSystemTime(new Date(currentDate + 'T12:00:00Z'));

      // C1: [Jan 06 ... Jan 27] (Ends Jan 27)
      // C2: Starts Feb 10.
      // Action: Add New Staff (99) to C1 -> Feb 03.
      // C1 New End: Feb 03.
      // Check C2 Start: Feb 03 + 7 days = Feb 10.
      // C2 Start is ALREADY Feb 10.
      // Expect C2 NOT to shift.

      const initialCyclesMock = [
        // C1
        { cycleId: 1, id: 601, eventDate: '2024-01-06', eventParticipants: [{ staffId: 1 }] },
        { cycleId: 1, id: 602, eventDate: '2024-01-13', eventParticipants: [{ staffId: 2 }] },
        { cycleId: 1, id: 603, eventDate: '2024-01-20', eventParticipants: [{ staffId: 3 }] },
        { cycleId: 1, id: 604, eventDate: '2024-01-27', eventParticipants: [{ staffId: 4 }] },
        // C2
        { cycleId: 2, id: 605, eventDate: '2024-02-10', eventParticipants: [{ staffId: 1 }] },
        { cycleId: 2, id: 606, eventDate: '2024-02-17', eventParticipants: [{ staffId: 2 }] },
      ] as any[];

      mockEventRepository.find.mockResolvedValue(initialCyclesMock);
      mockHolidayRepository.find.mockResolvedValue([]);
      mockEventRepository.save.mockImplementation(e => Promise.resolve({ ...e, id: 699 }));

      TestLogger.table('[BEFORE]', initialCyclesMock, [], currentDate);
      const result = await service.handleNewStaff(NEW_STAFF);
      const allEvents = result.after.flatMap(c => c.events.map(e => ({ ...e, cycleId: c.id })));
      TestLogger.table('[AFTER]', allEvents, [699], currentDate);

      const newStaff = allEvents.find(e => e.staffId === 99);
      const s1_c2 = allEvents.find(e => e.id === 605);

      expect(newStaff?.date).toBe('2024-02-03');
      expect(s1_c2?.date).toBe('2024-02-10'); // Unchanged
      TestLogger.assertion('Verified: New Staff -> Feb 03. C2 stays at Feb 10 (Standard 1 week gap preserved).');
    });
  });
});
